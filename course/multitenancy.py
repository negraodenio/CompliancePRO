"""
Módulo de Multi-tenancy & Contexto de Organização para CompliancePRO Light.
Garante isolamento absoluto entre diferentes clientes/empresas (Tenants).
"""
from typing import Optional
from fastapi import Header, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase_client import get_admin_client, get_tenant_client

security = HTTPBearer(auto_error=False)

class TenantContext:
    def __init__(self, organization_id: str, user_id: Optional[str] = None, role: str = "member"):
        self.organization_id = organization_id
        self.user_id = user_id
        self.role = role

def get_tenant_context(
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id", description="ID da Organização (Tenant)"),
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> TenantContext:
    """
    Middleware/Dependency de Injeção de Dependência Multi-tenant.
    Valida obrigatoriamente a autenticação (Bearer JWT) e se o usuário pertence à organização solicitada.
    """
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Autenticação obrigatória: Bearer Token JWT é necessário para acessar este recurso."
        )

    if not x_organization_id:
        raise HTTPException(
            status_code=400,
            detail="Header 'X-Organization-Id' é obrigatório para identificar o Tenant da requisição."
        )

    admin = get_admin_client()
    token = credentials.credentials

    try:
        user_client = get_tenant_client(token)
        user_data = user_client.auth.get_user(token)
        if not user_data or not user_data.user:
            raise HTTPException(status_code=401, detail="Sessão inválida ou expirada.")
        user_id = user_data.user.id
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token de autenticação inválido: {str(e)}")

    # Verifica se o usuário pertence à organização solicitada
    try:
        member_res = admin.table("organization_members").select("*")\
            .eq("organization_id", x_organization_id)\
            .eq("user_id", user_id)\
            .execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao verificar associação à organização: {str(e)}")

    if not member_res.data or len(member_res.data) == 0:
        raise HTTPException(
            status_code=403,
            detail="Acesso negado: Você não é membro desta organização."
        )

    user_role = member_res.data[0].get("role", "member")
    return TenantContext(organization_id=x_organization_id, user_id=user_id, role=user_role)
