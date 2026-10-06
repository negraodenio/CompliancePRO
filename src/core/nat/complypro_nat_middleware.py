"""
ComplyPRO.pt — Sprint NAT-POC-01
NVIDIA NeMo Agent Toolkit (NAT) x ComplyPRO Governance Middleware

Core Invariants:
1. Zero Downstream Modifications: Uses public `nat.middleware.FunctionMiddleware` API.
2. Compulsory Interception: Intercepts every function invocation BEFORE execution (prior to `call_next`).
3. Guardian Policy Enforcement:
   - ALLOW: Invokes `call_next` exactly once.
   - BLOCK: Throws ComplyProGuardianBlockError; exactly 0 downstream executions.
   - REQUIRE_HITL: Pauses execution; returns PAUSED session descriptor; exactly 0 downstream executions.
4. Zero Secrets in Worker: Worker holds no provider secrets.
"""

from __future__ import annotations

import json
from typing import Any, Callable, Dict, List, Optional
from pydantic import BaseModel

from nat.middleware.function_middleware import FunctionMiddleware
from nat.middleware import CallNext, FunctionMiddlewareContext


class ComplyProGuardianBlockError(PermissionError):
    """Raised when ComplyPRO Guardian policy returns BLOCK."""
    def __init__(self, reason: str, capability: str):
        super().__init__(f"GUARDIAN_BLOCK: Capability '{capability}' blocked by ComplyPRO Guardian: {reason}")
        self.reason = reason
        self.capability = capability


class ComplyProHitlRequiredException(Exception):
    """Raised or returned when ComplyPRO Guardian policy returns REQUIRE_HITL."""
    def __init__(self, gate_id: str, capability: str, reason: str):
        super().__init__(f"REQUIRE_HITL: Capability '{capability}' requires human supervisor approval (Gate: {gate_id})")
        self.gate_id = gate_id
        self.capability = capability
        self.reason = reason


class PassportContext(BaseModel):
    agent_id: str
    passport_id: str
    passport_fingerprint: str
    compliance_profile_checksum: str
    tenant_id: str = "TENANT-DEFAULT"
    declared_tools: List[str] = []
    declared_models: List[str] = []
    declared_data_scopes: List[str] = []
    status: str = "VALID"  # VALID, REVOKED, SUSPENDED


class InterceptionRecord(BaseModel):
    timestamp: str
    function_name: str
    channel: str  # TOOL or MODEL
    verdict: str  # ALLOW, BLOCK, REQUIRE_HITL
    gate_id: Optional[str] = None
    executed: bool
    args_repr: str


class ComplyProNatGovernanceMiddleware(FunctionMiddleware):
    """
    Public NAT FunctionMiddleware implementation binding NAT Agent invocations
    to ComplyPRO's Guardian policy evaluation engine.
    """

    def __init__(
        self,
        passport: PassportContext,
        external_evaluator: Optional[Callable[[Dict[str, Any]], Dict[str, Any]]] = None,
    ):
        super().__init__()
        self.passport = passport
        self.external_evaluator = external_evaluator
        self.interceptions: List[InterceptionRecord] = []
        self.active_gate_id: Optional[str] = None

    @property
    def enabled(self) -> bool:
        return True

    def _evaluate_policy(self, channel: str, capability: str, payload: Any) -> Dict[str, Any]:
        """
        Evaluates capability request against ComplyPRO Guardian rules.
        """
        # 1. Check Passport validity
        if self.passport.status == "REVOKED":
            return {"verdict": "BLOCK", "reason": "PASSPORT_REVOKED: Agent passport has been revoked"}
        if self.passport.status == "SUSPENDED":
            return {"verdict": "BLOCK", "reason": "AGENT_SUSPENDED: Agent is currently suspended due to risk threshold"}

        # 2. Check channel-specific declarations
        if channel == "TOOL":
            # Undeclared or explicitly prohibited tools
            if capability in ["prohibited.tool", "DIRECT_DB_DDL", "unauthorized_tool"]:
                return {"verdict": "BLOCK", "reason": f"PROHIBITED_CAPABILITY: Action {capability} is strictly forbidden"}
            if self.passport.declared_tools and capability not in self.passport.declared_tools:
                return {"verdict": "BLOCK", "reason": f"UNDECLARED_TOOL: Tool {capability} not declared in Agent Passport"}

            # High-risk financial tool threshold
            amount = 0
            if hasattr(payload, "amount"):
                amount = float(payload.amount)
            elif isinstance(payload, dict) and "amount" in payload:
                amount = float(payload["amount"])

            if capability == "credit.approve" and amount > 10000:
                gate_id = f"GATE-NAT-{self.passport.agent_id[:8]}-HITL"
                self.active_gate_id = gate_id
                return {
                    "verdict": "REQUIRE_HITL",
                    "gate_id": gate_id,
                    "reason": f"HIGH_RISK_THRESHOLD: Credit approval amount €{amount:,.2f} exceeds €10,000 threshold",
                }

            return {"verdict": "ALLOW", "reason": "Capability explicitly permitted by policy"}

        elif channel == "MODEL":
            if self.passport.declared_models and capability not in self.passport.declared_models:
                return {"verdict": "BLOCK", "reason": f"UNAUTHORIZED_MODEL: Model {capability} is not declared in Agent Passport"}
            return {"verdict": "ALLOW", "reason": "Model approved"}

        return {"verdict": "ALLOW", "reason": "Default allow"}

    async def function_middleware_invoke(
        self,
        *args: Any,
        call_next: CallNext,
        context: FunctionMiddlewareContext,
        **kwargs: Any,
    ) -> Any:
        import datetime

        fn_name = context.name
        input_data = args[0] if args else kwargs

        # Determine capability & channel
        channel = "MODEL" if "model" in fn_name.lower() or "llm" in fn_name.lower() else "TOOL"
        capability = getattr(input_data, "capability", None) or getattr(input_data, "model_name", None) or fn_name

        # Policy evaluation
        if self.external_evaluator:
            eval_result = self.external_evaluator({
                "channel": channel,
                "capability": capability,
                "payload": input_data,
                "passport": self.passport.model_dump(),
            })
        else:
            eval_result = self._evaluate_policy(channel, capability, input_data)

        verdict = eval_result.get("verdict", "ALLOW")
        reason = eval_result.get("reason", "")
        gate_id = eval_result.get("gate_id")

        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Handle BLOCK
        if verdict == "BLOCK":
            self.interceptions.append(InterceptionRecord(
                timestamp=now_str,
                function_name=fn_name,
                channel=channel,
                verdict="BLOCK",
                executed=False,
                args_repr=repr(args)[:120],
            ))
            raise ComplyProGuardianBlockError(reason=reason, capability=capability)

        # Handle REQUIRE_HITL
        if verdict == "REQUIRE_HITL":
            self.interceptions.append(InterceptionRecord(
                timestamp=now_str,
                function_name=fn_name,
                channel=channel,
                verdict="REQUIRE_HITL",
                gate_id=gate_id,
                executed=False,
                args_repr=repr(args)[:120],
            ))
            # Session pauses, does NOT call call_next!
            return {
                "status": "PAUSED",
                "verdict": "REQUIRE_HITL",
                "gate_id": gate_id,
                "reason": reason,
                "capability": capability,
                "execution_count": 0,
            }

        # Handle ALLOW
        self.interceptions.append(InterceptionRecord(
            timestamp=now_str,
            function_name=fn_name,
            channel=channel,
            verdict="ALLOW",
            executed=True,
            args_repr=repr(args)[:120],
        ))

        # Execute downstream function exactly once
        return await call_next(*args, **kwargs)
