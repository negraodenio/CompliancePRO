"""
CompliancePRO Light - Product API & Web Server
Commercial Multi-tenant SaaS, Supabase Auth Native, Team Management & Role-Based Governance OS Engine.
"""
import os
import json
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, Header, Security, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any

from multitenancy import get_tenant_context, TenantContext
from entitlements_service import EntitlementsService
from scan_storage_service import ScanStorageService
from invitations_service import InvitationsService
from supabase_client import get_admin_client, supabase_public, get_tenant_client

app = FastAPI(
    title="CompliancePRO Light API & Web",
    description="SaaS & Enterprise Multi-tenant AI Governance & Audit Engine",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)
entitlements_service = EntitlementsService()
storage_service = ScanStorageService()
invitations_service = InvitationsService()

# --- UTILS FOR ROLE PARSING ---
ENTERPRISE_ROLES = ["CISO", "DPO", "AI_OFFICE", "LEGAL", "BOARD", "SECURITY_LEAD", "ENGINEER", "AUDITOR", "VIEWER"]

def parse_membership_role(raw_role: Optional[str]) -> Dict[str, Any]:
    """
    Parses a raw role string (e.g. 'owner', 'admin:DPO', 'member:ENGINEER', 'CISO')
    into standardized admin_role, enterprise_role, and is_owner.
    """
    if not raw_role:
        return {"admin_role": "member", "enterprise_role": "VIEWER", "is_owner": False}

    if ":" in raw_role:
        parts = raw_role.split(":", 1)
        admin_role = parts[0].strip().lower()
        enterprise_role = parts[1].strip().upper()
        if enterprise_role not in ENTERPRISE_ROLES:
            enterprise_role = "VIEWER"
        return {
            "admin_role": admin_role,
            "enterprise_role": enterprise_role,
            "is_owner": (admin_role == "owner")
        }

    raw_lower = raw_role.strip().lower()
    raw_upper = raw_role.strip().upper()

    if raw_lower == "owner":
        return {"admin_role": "owner", "enterprise_role": "CISO", "is_owner": True}
    elif raw_lower == "admin":
        return {"admin_role": "admin", "enterprise_role": "CISO", "is_owner": False}
    elif raw_lower == "auditor":
        return {"admin_role": "member", "enterprise_role": "AUDITOR", "is_owner": False}
    elif raw_upper in ENTERPRISE_ROLES:
        return {"admin_role": "member", "enterprise_role": raw_upper, "is_owner": False}
    else:
        return {"admin_role": "member", "enterprise_role": "VIEWER", "is_owner": False}

# --- DTOs / Schemas ---
class SignUpRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    desired_role: Optional[str] = "CISO"

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str
    organization_id: str
    organization_name: str
    plan_tier: str
    admin_role: str
    enterprise_role: str
    is_owner: bool
    monthly_scan_quota: int
    used_scans: int
    organizations: List[Dict[str, Any]] = []

class InviteCreateRequest(BaseModel):
    email: str
    enterprise_role: str = "VIEWER"
    admin_role: str = "member"

class RoleUpdateRequest(BaseModel):
    enterprise_role: Optional[str] = None
    admin_role: Optional[str] = None

class ScanItemSummary(BaseModel):
    id: str
    repository_name: str
    compliance_score: float
    risk_level: str
    total_files: int
    total_agents: int
    created_at: str

class ScanDetailResponse(BaseModel):
    id: str
    repository_name: str
    scanner_version: str
    compliance_score: float
    risk_level: str
    total_files: int
    total_agents: int
    frameworks_breakdown: Dict[str, Any]
    cg_ag_assessment: Optional[Dict[str, Any]] = None
    findings: List[Dict[str, Any]] = []
    summary_report: Optional[str] = None
    created_at: str

# --- AUTHENTICATION ENDPOINTS ---

@app.post("/api/v1/auth/signup", response_model=AuthResponse, summary="Cadastrar novo usuário e organização")
def sign_up(payload: SignUpRequest):
    admin = get_admin_client()
    full_name = payload.full_name or payload.email.split("@")[0]
    
    try:
        created_user = admin.auth.admin.create_user({
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": full_name
            }
        })
        user_id = created_user.user.id
    except Exception as e:
        try:
            auth_res = supabase_public.auth.sign_up({
                "email": payload.email,
                "password": payload.password,
                "options": {"data": {"full_name": full_name}}
            })
            if not auth_res.user:
                raise HTTPException(status_code=400, detail="Não foi possível criar o usuário.")
            user_id = auth_res.user.id
        except Exception as err2:
            raise HTTPException(status_code=400, detail=f"Erro no cadastro: {str(err2)}")

    try:
        login_res = supabase_public.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })
        token = login_res.session.access_token if login_res.session else ""
    except Exception:
        token = ""

    # Check or create organization
    member_res = admin.table("organization_members").select("organization_id, role, organizations(id, name, slug, plan_tier)").eq("user_id", user_id).execute()
    
    enterprise_role = payload.desired_role.upper() if payload.desired_role and payload.desired_role.upper() in ENTERPRISE_ROLES else "CISO"
    encoded_role = f"owner:{enterprise_role}"

    if not member_res.data:
        company_label = payload.company_name or f"{full_name}'s Enterprise"
        slug_base = "".join(c if c.isalnum() else "-" for c in company_label.lower()).strip("-")
        org_slug = f"{slug_base[:30]}-{user_id[:8]}"

        org_res = admin.table("organizations").insert({
            "name": company_label,
            "slug": org_slug,
            "plan_tier": "free"
        }).execute()
        org_id = org_res.data[0]["id"]
        admin.table("organization_members").insert({
            "organization_id": org_id, 
            "user_id": user_id, 
            "role": encoded_role
        }).execute()
        ent = entitlements_service.create_default_free_tier(org_id)
        org_name = org_res.data[0]["name"]
        plan_tier = "free"
    else:
        org_data = member_res.data[0]
        org_id = org_data["organization_id"]
        org_name = org_data["organizations"]["name"]
        plan_tier = org_data["organizations"]["plan_tier"]
        ent = entitlements_service.get_organization_entitlements(org_id) or {}

    role_info = parse_membership_role(encoded_role)

    # Fetch all organizations the user belongs to
    all_members = admin.table("organization_members").select("organization_id, role, organizations(id, name, slug, plan_tier)").eq("user_id", user_id).execute()
    org_list = []
    for m in (all_members.data or []):
        o = m.get("organizations") or {}
        r_parsed = parse_membership_role(m.get("role"))
        org_list.append({
            "id": m.get("organization_id"),
            "name": o.get("name", "Workspace"),
            "slug": o.get("slug", ""),
            "plan_tier": o.get("plan_tier", "free"),
            "admin_role": r_parsed["admin_role"],
            "enterprise_role": r_parsed["enterprise_role"],
            "is_owner": r_parsed["is_owner"]
        })

    return AuthResponse(
        access_token=token,
        user_id=user_id,
        email=payload.email,
        full_name=full_name,
        organization_id=org_id,
        organization_name=org_name,
        plan_tier=plan_tier,
        admin_role=role_info["admin_role"],
        enterprise_role=role_info["enterprise_role"],
        is_owner=role_info["is_owner"],
        monthly_scan_quota=ent.get("monthly_scan_quota", 5),
        used_scans=ent.get("used_scans_period", 0),
        organizations=org_list
    )

@app.post("/api/v1/auth/login", response_model=AuthResponse, summary="Fazer Login")
def login(payload: LoginRequest):
    try:
        auth_res = supabase_public.auth.sign_in_with_password({"email": payload.email, "password": payload.password})
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Credenciais inválidas: {str(e)}")

    if not auth_res.user or not auth_res.session:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos.")

    user_id = auth_res.user.id
    token = auth_res.session.access_token
    full_name = (auth_res.user.user_metadata or {}).get("full_name", payload.email.split("@")[0])

    admin = get_admin_client()
    member_res = admin.table("organization_members").select("organization_id, role, organizations(id, name, slug, plan_tier)").eq("user_id", user_id).execute()
    
    if not member_res.data:
        raise HTTPException(status_code=404, detail="Nenhum workspace encontrado para este usuário.")

    org_data = member_res.data[0]
    org_id = org_data["organization_id"]
    org_info = org_data["organizations"]
    ent = entitlements_service.get_organization_entitlements(org_id) or {}
    role_info = parse_membership_role(org_data.get("role"))

    # Super admin bypass
    is_master = payload.email == "negraodenio@gmail.com"
    plan_tier = "enterprise" if is_master else org_info.get("plan_tier", "free")
    quota = 999999 if is_master else ent.get("monthly_scan_quota", 5)

    # Fetch all organizations for switching
    all_members = admin.table("organization_members").select("organization_id, role, organizations(id, name, slug, plan_tier)").eq("user_id", user_id).execute()
    org_list = []
    for m in (all_members.data or []):
        o = m.get("organizations") or {}
        r_parsed = parse_membership_role(m.get("role"))
        org_list.append({
            "id": m.get("organization_id"),
            "name": o.get("name", "Workspace"),
            "slug": o.get("slug", ""),
            "plan_tier": o.get("plan_tier", "free"),
            "admin_role": r_parsed["admin_role"],
            "enterprise_role": r_parsed["enterprise_role"],
            "is_owner": r_parsed["is_owner"]
        })

    return AuthResponse(
        access_token=token,
        user_id=user_id,
        email=payload.email,
        full_name=full_name,
        organization_id=org_id,
        organization_name=org_info.get("name", "Workspace"),
        plan_tier=plan_tier,
        admin_role="owner" if is_master else role_info["admin_role"],
        enterprise_role="CISO" if is_master else role_info["enterprise_role"],
        is_owner=True if is_master else role_info["is_owner"],
        monthly_scan_quota=quota,
        used_scans=ent.get("used_scans_period", 0),
        organizations=org_list
    )

@app.get("/api/v1/auth/me", summary="Dados Hidratados do Usuário e Workspace Ativo")
def get_current_user_profile(
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id"),
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Token de autorização obrigatório.")

    token = credentials.credentials
    try:
        user_client = get_tenant_client(token)
        user_res = user_client.auth.get_user(token)
        user_id = user_res.user.id
        email = user_res.user.email
        full_name = (user_res.user.user_metadata or {}).get("full_name", email.split("@")[0])
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Sessão expirada ou inválida: {str(e)}")

    admin = get_admin_client()
    all_members = admin.table("organization_members").select("role, organization_id, organizations(*)").eq("user_id", user_id).execute()
    
    if not all_members.data or len(all_members.data) == 0:
        raise HTTPException(status_code=404, detail="Usuário não possui vínculo com nenhuma organização.")

    # Select requested org or default to first
    active_membership = None
    if x_organization_id:
        for m in all_members.data:
            if m["organization_id"] == x_organization_id:
                active_membership = m
                break
    
    if not active_membership:
        active_membership = all_members.data[0]

    org_item = active_membership
    org_id = org_item["organization_id"]
    ent = entitlements_service.get_organization_entitlements(org_id) or {}
    role_info = parse_membership_role(org_item.get("role"))

    is_master = email == "negraodenio@gmail.com"

    org_list = []
    for m in all_members.data:
        o = m.get("organizations") or {}
        r_parsed = parse_membership_role(m.get("role"))
        org_list.append({
            "id": m.get("organization_id"),
            "name": o.get("name", "Workspace"),
            "slug": o.get("slug", ""),
            "plan_tier": o.get("plan_tier", "free"),
            "admin_role": r_parsed["admin_role"],
            "enterprise_role": r_parsed["enterprise_role"],
            "is_owner": r_parsed["is_owner"]
        })

    return {
        "user_id": user_id,
        "email": email,
        "full_name": full_name,
        "is_master": is_master,
        "active_organization": org_item["organizations"],
        "is_owner": True if is_master else role_info["is_owner"],
        "admin_role": "owner" if is_master else role_info["admin_role"],
        "enterprise_role": "CISO" if is_master else role_info["enterprise_role"],
        "entitlements": ent,
        "organizations": org_list
    }

# --- TEAM MANAGEMENT & INVITATION ENDPOINTS ---

@app.get("/api/v1/organizations/{org_id}/members", summary="Listar Membros da Organização")
def list_organization_members(
    org_id: str,
    tenant_ctx: TenantContext = Depends(get_tenant_context)
):
    admin = get_admin_client()
    members_res = admin.table("organization_members").select("id, user_id, role, created_at").eq("organization_id", org_id).execute()
    
    members_data = []
    for m in (members_res.data or []):
        uid = m.get("user_id")
        user_email = "member@empresa.com"
        user_name = "Team Member"
        try:
            u_info = admin.auth.admin.get_user_by_id(uid)
            if u_info and u_info.user:
                user_email = u_info.user.email
                user_name = (u_info.user.user_metadata or {}).get("full_name", user_email.split("@")[0])
        except Exception:
            pass

        role_info = parse_membership_role(m.get("role"))
        members_data.append({
            "id": m.get("id"),
            "user_id": uid,
            "email": user_email,
            "full_name": user_name,
            "is_owner": role_info["is_owner"],
            "admin_role": role_info["admin_role"],
            "enterprise_role": role_info["enterprise_role"],
            "created_at": m.get("created_at")
        })

    return members_data

@app.post("/api/v1/organizations/{org_id}/invitations", summary="Convidar Novo Membro para a Organização")
def invite_member(
    org_id: str,
    payload: InviteCreateRequest,
    tenant_ctx: TenantContext = Depends(get_tenant_context)
):
    # Only Owner or Admin can invite
    parsed_role = parse_membership_role(tenant_ctx.role)
    if not (parsed_role["is_owner"] or parsed_role["admin_role"] in ["owner", "admin"]):
        raise HTTPException(status_code=403, detail="Apenas Owners ou Administradores podem convidar membros.")

    inv = invitations_service.create_invitation(
        organization_id=org_id,
        email=payload.email,
        enterprise_role=payload.enterprise_role,
        admin_role=payload.admin_role,
        invited_by=tenant_ctx.user_id
    )

    return {
        "message": f"Convite criado com sucesso para {payload.email}",
        "invitation": inv,
        "invite_link": f"/join?token={inv['raw_token']}"
    }

@app.get("/api/v1/organizations/{org_id}/invitations", summary="Listar Convites Pendentes da Organização")
def list_org_invitations(
    org_id: str,
    tenant_ctx: TenantContext = Depends(get_tenant_context)
):
    return invitations_service.list_organization_invitations(org_id)

@app.delete("/api/v1/organizations/{org_id}/invitations/{invitation_id}", summary="Revogar Convite")
def revoke_org_invitation(
    org_id: str,
    invitation_id: str,
    tenant_ctx: TenantContext = Depends(get_tenant_context)
):
    parsed_role = parse_membership_role(tenant_ctx.role)
    if not (parsed_role["is_owner"] or parsed_role["admin_role"] in ["owner", "admin"]):
        raise HTTPException(status_code=403, detail="Apenas Owners ou Administradores podem revogar convites.")

    invitations_service.revoke_invitation(invitation_id, org_id)
    return {"message": "Convite revogado com sucesso."}

@app.get("/api/v1/invitations/{raw_token}/validate", summary="Validar Token de Convite")
def validate_invite_token(raw_token: str):
    inv = invitations_service.validate_invitation(raw_token)
    if not inv:
        raise HTTPException(status_code=404, detail="Convite inválido, expirado ou revogado.")
    
    return {
        "valid": True,
        "email": inv.get("email"),
        "enterprise_role": inv.get("enterprise_role"),
        "admin_role": inv.get("admin_role"),
        "organization_name": (inv.get("organizations") or {}).get("name", "Workspace"),
        "expires_at": inv.get("expires_at")
    }

@app.post("/api/v1/invitations/{raw_token}/accept", summary="Aceitar Convite e Vincular à Organização")
def accept_invite(
    raw_token: str,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Você precisa estar autenticado para aceitar o convite.")

    token = credentials.credentials
    try:
        user_client = get_tenant_client(token)
        user_res = user_client.auth.get_user(token)
        user_id = user_res.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Sessão inválida: {str(e)}")

    try:
        res = invitations_service.accept_invitation(raw_token, user_id)
        return {
            "message": "Convite aceito com sucesso! Você agora é membro da organização.",
            "membership": res
        }
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

@app.patch("/api/v1/organizations/{org_id}/members/{user_id}", summary="Alterar Papel de Membro")
def update_member_role(
    org_id: str,
    user_id: str,
    payload: RoleUpdateRequest,
    tenant_ctx: TenantContext = Depends(get_tenant_context)
):
    parsed_role = parse_membership_role(tenant_ctx.role)
    if not (parsed_role["is_owner"] or parsed_role["admin_role"] in ["owner", "admin"]):
        raise HTTPException(status_code=403, detail="Apenas Owners ou Administradores podem alterar papéis.")

    admin = get_admin_client()
    target_res = admin.table("organization_members").select("*").eq("organization_id", org_id).eq("user_id", user_id).execute()
    if not target_res.data:
        raise HTTPException(status_code=404, detail="Membro não encontrado.")

    current = parse_membership_role(target_res.data[0].get("role"))
    if current["is_owner"] and not parsed_role["is_owner"]:
        raise HTTPException(status_code=403, detail="Não é permitido alterar o cargo do Owner da conta.")

    new_admin = payload.admin_role.lower() if payload.admin_role else current["admin_role"]
    new_enterprise = payload.enterprise_role.upper() if payload.enterprise_role else current["enterprise_role"]
    encoded = f"{new_admin}:{new_enterprise}"

    admin.table("organization_members").update({"role": encoded}).eq("organization_id", org_id).eq("user_id", user_id).execute()
    return {"message": "Cargo atualizado com sucesso.", "role": encoded}

@app.delete("/api/v1/organizations/{org_id}/members/{user_id}", summary="Remover Membro da Organização")
def remove_member(
    org_id: str,
    user_id: str,
    tenant_ctx: TenantContext = Depends(get_tenant_context)
):
    parsed_role = parse_membership_role(tenant_ctx.role)
    if not (parsed_role["is_owner"] or parsed_role["admin_role"] in ["owner", "admin"]):
        raise HTTPException(status_code=403, detail="Apenas Owners ou Administradores podem remover membros.")

    if user_id == tenant_ctx.user_id:
        raise HTTPException(status_code=400, detail="Não é possível remover a si mesmo da organização.")

    admin = get_admin_client()
    target_res = admin.table("organization_members").select("*").eq("organization_id", org_id).eq("user_id", user_id).execute()
    if not target_res.data:
        raise HTTPException(status_code=404, detail="Membro não encontrado.")

    target_parsed = parse_membership_role(target_res.data[0].get("role"))
    if target_parsed["is_owner"]:
        raise HTTPException(status_code=403, detail="Não é permitido remover o Owner da conta.")

    admin.table("organization_members").delete().eq("organization_id", org_id).eq("user_id", user_id).execute()
    return {"message": "Membro removido da organização com sucesso."}

# --- SCANS & GOVERNANCE ENDPOINTS ---

@app.post("/api/v1/scans/run", summary="Executar e Persistir Nova Análise")
def run_scan(
    payload: Dict[str, Any],
    tenant_ctx: TenantContext = Depends(get_tenant_context)
):
    org_id = tenant_ctx.organization_id
    can_scan, reason = entitlements_service.can_run_scan(org_id, is_deep_cg_ag=True)
    if not can_scan:
        raise HTTPException(status_code=402, detail=f"Limite de análises atingido ou restrição de plano: {reason}")

    repo_name = payload.get("repository_name", "AI-Agent-Pipeline")
    repo_id = storage_service.create_or_get_repository(org_id, repo_name)

    scan_res = storage_service.save_scan_result(
        org_id=org_id,
        repository_id=repo_id,
        compliance_score=float(payload.get("compliance_score", 90.0)),
        risk_level=payload.get("risk_level", "LOW"),
        frameworks_breakdown=payload.get("frameworks_breakdown", {}),
        cg_ag_assessment=payload.get("cg_ag_assessment", {}),
        findings=payload.get("findings", []),
        total_files=int(payload.get("total_files", 0)),
        total_agents=int(payload.get("total_agents", 0)),
        summary_report=payload.get("summary_report", "Auditoria executada com sucesso."),
        triggered_by=tenant_ctx.user_id
    )

    entitlements_service.record_scan_usage(org_id)
    return scan_res

@app.get("/api/v1/scans", response_model=List[ScanItemSummary], summary="Listar Histórico de Análises")
def list_workspace_scans(
    tenant_ctx: TenantContext = Depends(get_tenant_context),
    limit: int = Query(20, ge=1, le=100)
):
    admin = get_admin_client()
    scans_res = admin.table("scans").select("id, compliance_score, risk_level, total_files_analyzed, total_agents_detected, created_at, repositories(name)")        .eq("organization_id", tenant_ctx.organization_id)        .order("created_at", desc=True)        .limit(limit)        .execute()

    items = []
    for s in (scans_res.data or []):
        repo_name = (s.get("repositories") or {}).get("name", "Repositório")
        items.append(ScanItemSummary(
            id=s["id"],
            repository_name=repo_name,
            compliance_score=float(s.get("compliance_score", 0)),
            risk_level=s.get("risk_level", "UNKNOWN"),
            total_files=s.get("total_files_analyzed", 0),
            total_agents=s.get("total_agents_detected", 0),
            created_at=s.get("created_at")
        ))
    return items

@app.get("/api/v1/scans/{scan_id}", response_model=ScanDetailResponse, summary="Ver Detalhes de uma Análise")
def get_scan_details(
    scan_id: str,
    tenant_ctx: TenantContext = Depends(get_tenant_context)
):
    admin = get_admin_client()
    scan_res = admin.table("scans").select("*, repositories(name), scan_findings(*)")        .eq("id", scan_id)        .eq("organization_id", tenant_ctx.organization_id)        .execute()

    if not scan_res.data or len(scan_res.data) == 0:
        raise HTTPException(status_code=404, detail="Análise não encontrada neste workspace.")

    s = scan_res.data[0]
    repo_name = (s.get("repositories") or {}).get("name", "Repositório")
    findings = s.get("scan_findings") or []

    return ScanDetailResponse(
        id=s["id"],
        repository_name=repo_name,
        scanner_version=s.get("scanner_version", "1.0.0"),
        compliance_score=float(s.get("compliance_score", 0)),
        risk_level=s.get("risk_level", "UNKNOWN"),
        total_files=s.get("total_files_analyzed", 0),
        total_agents=s.get("total_agents_detected", 0),
        frameworks_breakdown=s.get("frameworks_breakdown") or {},
        cg_ag_assessment=s.get("cg_ag_assessment"),
        findings=findings,
        summary_report=s.get("summary_report"),
        created_at=s.get("created_at")
    )

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.1.0", "engine": "CG-AG Multi-Tenant SaaS"}
