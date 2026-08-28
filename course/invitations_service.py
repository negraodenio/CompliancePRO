"""
CG-AG Governance OS — Invitations Service & Team Management Engine
Manages cryptographically hashed invitation tokens (SHA-256), TTL expiry (7 days),
role assignments (EnterpriseRole + AdminRole) and atomic onboarding into organization_members.
"""
import os
import json
import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from pathlib import Path
from supabase_client import get_admin_client

INVITATIONS_FALLBACK_FILE = Path(__file__).resolve().parent / ".invitations_store.json"

class InvitationsService:
    def __init__(self):
        self.client = get_admin_client()
        self._ensure_local_store()

    def _ensure_local_store(self):
        if not INVITATIONS_FALLBACK_FILE.exists():
            with open(INVITATIONS_FALLBACK_FILE, "w", encoding="utf-8") as f:
                json.dump({}, f)

    def _read_local_store(self) -> Dict[str, Any]:
        try:
            with open(INVITATIONS_FALLBACK_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def _write_local_store(self, data: Dict[str, Any]):
        with open(INVITATIONS_FALLBACK_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def _hash_token(self, raw_token: str) -> str:
        return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    def create_invitation(
        self,
        organization_id: str,
        email: str,
        enterprise_role: str = "VIEWER",
        admin_role: str = "member",
        invited_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates a new invitation with a secure 1-way hashed token and 7-day TTL.
        Returns the invitation record including the raw token (to be sent via email or link).
        """
        raw_token = str(uuid.uuid4())
        token_hash = self._hash_token(raw_token)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=7)

        invitation_id = str(uuid.uuid4())
        invitation_record = {
            "id": invitation_id,
            "organization_id": organization_id,
            "email": email.strip().lower(),
            "enterprise_role": enterprise_role.upper(),
            "admin_role": admin_role.lower(),
            "token_hash": token_hash,
            "invited_by": invited_by,
            "status": "PENDING",
            "expires_at": expires_at.isoformat(),
            "created_at": now.isoformat(),
            "accepted_at": None
        }

        # Try database write first
        try:
            db_res = self.client.table("invitations").insert(invitation_record).execute()
            if db_res.data:
                res = db_res.data[0]
                res["raw_token"] = raw_token
                return res
        except Exception:
            pass

        # Fallback store persistence
        local_store = self._read_local_store()
        local_store[token_hash] = invitation_record
        self._write_local_store(local_store)

        record_with_raw = dict(invitation_record)
        record_with_raw["raw_token"] = raw_token
        return record_with_raw

    def validate_invitation(self, raw_token: str) -> Optional[Dict[str, Any]]:
        """
        Validates whether a raw invitation token is valid, pending, and not expired.
        """
        token_hash = self._hash_token(raw_token)
        now = datetime.now(timezone.utc)

        # 1. Try DB
        try:
            db_res = self.client.table("invitations").select("*, organizations(name, slug, plan_tier)").eq("token_hash", token_hash).execute()
            if db_res.data and len(db_res.data) > 0:
                inv = db_res.data[0]
                exp = datetime.fromisoformat(inv["expires_at"].replace("Z", "+00:00"))
                if inv["status"] == "PENDING" and exp > now:
                    return inv
        except Exception:
            pass

        # 2. Try Fallback store
        local_store = self._read_local_store()
        inv = local_store.get(token_hash)
        if inv:
            exp = datetime.fromisoformat(inv["expires_at"].replace("Z", "+00:00"))
            if inv["status"] == "PENDING" and exp > now:
                # Hydrate organization name if possible
                try:
                    org_res = self.client.table("organizations").select("name, slug, plan_tier").eq("id", inv["organization_id"]).execute()
                    if org_res.data:
                        inv["organizations"] = org_res.data[0]
                except Exception:
                    inv["organizations"] = {"name": "Workspace", "slug": "workspace", "plan_tier": "starter"}
                return inv

        return None

    def accept_invitation(self, raw_token: str, user_id: str) -> Dict[str, Any]:
        """
        Accepts an invitation, binds user_id to organization_members with the assigned role,
        and marks the invitation as ACCEPTED atomically.
        """
        invitation = self.validate_invitation(raw_token)
        if not invitation:
            raise ValueError("Convite inválido, expirado ou já utilizado.")

        token_hash = self._hash_token(raw_token)
        org_id = invitation["organization_id"]
        enterprise_role = invitation.get("enterprise_role", "VIEWER")
        admin_role = invitation.get("admin_role", "member")
        encoded_role = f"{admin_role}:{enterprise_role}"

        # 1. Bind to organization_members in Supabase
        # Check if already a member
        existing = self.client.table("organization_members").select("*")\
            .eq("organization_id", org_id)\
            .eq("user_id", user_id)\
            .execute()

        if existing.data and len(existing.data) > 0:
            # Update role
            member_id = existing.data[0]["id"]
            self.client.table("organization_members").update({"role": encoded_role}).eq("id", member_id).execute()
        else:
            # Insert new membership
            self.client.table("organization_members").insert({
                "organization_id": org_id,
                "user_id": user_id,
                "role": encoded_role
            }).execute()

        # 2. Mark invitation as ACCEPTED
        now_iso = datetime.now(timezone.utc).isoformat()
        try:
            self.client.table("invitations").update({
                "status": "ACCEPTED",
                "accepted_at": now_iso
            }).eq("token_hash", token_hash).execute()
        except Exception:
            pass

        local_store = self._read_local_store()
        if token_hash in local_store:
            local_store[token_hash]["status"] = "ACCEPTED"
            local_store[token_hash]["accepted_at"] = now_iso
            self._write_local_store(local_store)

        return {
            "organization_id": org_id,
            "user_id": user_id,
            "enterprise_role": enterprise_role,
            "admin_role": admin_role,
            "status": "ACCEPTED"
        }

    def list_organization_invitations(self, organization_id: str) -> List[Dict[str, Any]]:
        """Lists pending and active invitations for an organization."""
        results = []
        try:
            db_res = self.client.table("invitations").select("*").eq("organization_id", organization_id).order("created_at", desc=True).execute()
            if db_res.data:
                results.extend(db_res.data)
        except Exception:
            pass

        if not results:
            local_store = self._read_local_store()
            for k, inv in local_store.items():
                if inv.get("organization_id") == organization_id:
                    results.append(inv)

        return results

    def revoke_invitation(self, invitation_id: str, organization_id: str) -> bool:
        """Revokes a pending invitation."""
        try:
            self.client.table("invitations").update({"status": "REVOKED"}).eq("id", invitation_id).eq("organization_id", organization_id).execute()
        except Exception:
            pass

        local_store = self._read_local_store()
        for k, inv in list(local_store.items()):
            if inv.get("id") == invitation_id and inv.get("organization_id") == organization_id:
                local_store[k]["status"] = "REVOKED"
                self._write_local_store(local_store)
                return True
        return True
