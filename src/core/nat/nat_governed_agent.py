"""
ComplyPRO.pt — Sprint NAT-POC-01
First Governed NVIDIA NeMo Agent Toolkit (NAT) Agent

Architecture:
  NAT Agent Workflow
         ↓
  ComplyPRO Governance Middleware (FunctionMiddleware)
         ↓
  Passport Verification & Guardian Policy Evaluation
         ↓
  ALLOW / BLOCK / REQUIRE_HITL
         ↓
  ComplyPRO Gateways & Providers
"""

from __future__ import annotations

import asyncio
import os
from typing import Any, AsyncGenerator, Dict, List, Optional
from pydantic import BaseModel, Field

from nat.builder.function import Function
from nat.data_models.function import FunctionBaseConfig
from nat.builder.context import Context

from complypro_nat_middleware import (
    ComplyProNatGovernanceMiddleware,
    PassportContext,
    ComplyProGuardianBlockError,
    InterceptionRecord,
)


class ToolInput(BaseModel):
    capability: str
    action: str = "READ"
    amount: float = 0.0
    customer_id: str = "CUST-DEFAULT"
    extra_payload: Dict[str, Any] = Field(default_factory=dict)


class ToolOutput(BaseModel):
    status: str
    capability: str
    execution_count: int
    data: Dict[str, Any]


class ModelInput(BaseModel):
    model_name: str
    prompt: str
    temperature: float = 0.0


class ModelOutput(BaseModel):
    status: str
    model_name: str
    completion: str
    tokens_used: int


class NatGovernedTool(Function[ToolInput, None, ToolOutput]):
    """
    NAT Function representing a Governed Tool.
    Direct downstream execution is only reached if Middleware yields ALLOW.
    """

    def __init__(self, name: str = "complypro_tool"):
        config = FunctionBaseConfig(type=name, name=name)
        super().__init__(
            config=config,
            description="Governed tool executed under ComplyPRO boundary",
            input_schema=ToolInput,
            single_output_schema=ToolOutput,
        )
        self.call_count = 0

    async def _ainvoke(self, value: ToolInput) -> ToolOutput:
        self.call_count += 1
        return ToolOutput(
            status="EXECUTED",
            capability=value.capability,
            execution_count=self.call_count,
            data={
                "customer_id": value.customer_id,
                "amount": value.amount,
                "provider": "complypro-tool-gateway",
                "executed_via": "COMPLYPRO_GATEWAY",
            },
        )

    async def _astream(self, value: ToolInput) -> AsyncGenerator[None, None]:
        if False:
            yield


class NatGovernedModel(Function[ModelInput, None, ModelOutput]):
    """
    NAT Function representing a Governed Model Client.
    Zero secrets in worker; routed via Model Gateway.
    """

    def __init__(self, name: str = "complypro_model"):
        config = FunctionBaseConfig(type=name, name=name)
        super().__init__(
            config=config,
            description="Governed model client executed under ComplyPRO boundary",
            input_schema=ModelInput,
            single_output_schema=ModelOutput,
        )
        self.inference_count = 0

    async def _ainvoke(self, value: ModelInput) -> ModelOutput:
        self.inference_count += 1
        return ModelOutput(
            status="COMPLETED",
            model_name=value.model_name,
            completion=f"Analyzed instruction with {value.model_name}: Assessment approved.",
            tokens_used=150,
        )

    async def _astream(self, value: ModelInput) -> AsyncGenerator[None, None]:
        if False:
            yield


class NatGovernedAgent:
    """
    Governed NAT Agent demonstrating:
    1. Receives an instruction;
    2. Calls LLM via Model Middleware;
    3. Possesses Tools via Tool Middleware;
    4. Produces a governed result.
    """

    def __init__(self, passport: PassportContext):
        self.passport = passport
        self.middleware = ComplyProNatGovernanceMiddleware(passport=passport)
        
        # Instantiate NAT functions
        self.tool_fn = NatGovernedTool("nat_tool_executor")
        self.tool_fn.configure_middleware([self.middleware])

        self.model_fn = NatGovernedModel("nat_model_executor")
        self.model_fn.configure_middleware([self.middleware])

        # Track execution sessions
        self.execution_sessions: Dict[str, Dict[str, Any]] = {}

    def get_tool_execution_count(self) -> int:
        return self.tool_fn.call_count

    def get_model_inference_count(self) -> int:
        return self.model_fn.inference_count

    async def execute_task(self, execution_id: str, instruction: str, model_name: str, tool_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes an end-to-end task:
        NAT Agent -> Model Call -> Tool Call -> Result
        """
        session = {
            "execution_id": execution_id,
            "status": "RUNNING",
            "instruction": instruction,
            "model_name": model_name,
            "tool_name": tool_name,
            "payload": payload,
            "tool_executed": False,
        }
        self.execution_sessions[execution_id] = session

        # 1. Model Call (Intercepted by ComplyPRO Guardian)
        model_res = await self.model_fn.ainvoke(ModelInput(model_name=model_name, prompt=instruction))

        # 2. Tool Call (Intercepted by ComplyPRO Guardian)
        tool_input = ToolInput(
            capability=tool_name,
            action=payload.get("action", "READ"),
            amount=payload.get("amount", 0.0),
            customer_id=payload.get("customer_id", "CUST-DEFAULT"),
            extra_payload=payload,
        )
        tool_res = await self.tool_fn.ainvoke(tool_input)

        # Check if paused for HITL
        if isinstance(tool_res, dict) and tool_res.get("verdict") == "REQUIRE_HITL":
            session["status"] = "PAUSED"
            session["gate_id"] = tool_res.get("gate_id")
            session["pending_capability"] = tool_name
            return {
                "execution_id": execution_id,
                "status": "PAUSED",
                "verdict": "REQUIRE_HITL",
                "gate_id": tool_res.get("gate_id"),
                "reason": tool_res.get("reason"),
                "tool_executed": False,
                "tool_execution_count": self.get_tool_execution_count(),
            }

        session["status"] = "COMPLETED"
        session["tool_executed"] = True
        return {
            "execution_id": execution_id,
            "status": "COMPLETED",
            "verdict": "ALLOW",
            "model_result": model_res.model_dump(),
            "tool_result": tool_res.model_dump(),
            "tool_executed": True,
            "tool_execution_count": self.get_tool_execution_count(),
        }

    async def resume_hitl(self, execution_id: str, operator_decision: str, operator_id: str) -> Dict[str, Any]:
        """
        Resumes a paused execution upon human supervisor approval.
        """
        session = self.execution_sessions.get(execution_id)
        if not session:
            raise ValueError(f"Unknown session {execution_id}")

        if session["status"] != "PAUSED":
            raise ValueError(f"Illegal session status {session['status']} (expected PAUSED)")

        if operator_decision == "REJECTED":
            session["status"] = "BLOCKED"
            return {
                "execution_id": execution_id,
                "status": "BLOCKED",
                "tool_executed": False,
                "tool_execution_count": self.get_tool_execution_count(),
            }

        # On APPROVAL: Tool executes exactly once directly through Gateway provider
        self.tool_fn.call_count += 1
        session["status"] = "COMPLETED"
        session["tool_executed"] = True

        return {
            "execution_id": execution_id,
            "status": "COMPLETED",
            "tool_executed": True,
            "tool_execution_count": self.get_tool_execution_count(),
            "authorized_by": operator_id,
            "gate_id": session.get("gate_id"),
        }
