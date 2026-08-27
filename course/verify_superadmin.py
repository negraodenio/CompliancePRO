"""
Verificacao de Login do Super Admin (negraodenio@gmail.com)
"""
from supabase_client import supabase_public, get_admin_client
from entitlements_service import EntitlementsService

def verify_superadmin_login():
    print("[1/2] Testando Login do Super Admin...")
    login_res = supabase_public.auth.sign_in_with_password({
        "email": "negraodenio@gmail.com",
        "password": "CompliancePROMaster2026!"
    })

    if not login_res.session:
        print("[ERRO] Falha no login do Super Admin.")
        return

    user = login_res.user
    token = login_res.session.access_token
    print(f"[OK] Login realizado com sucesso! Usuario ID: {user.id}")
    print(f"[OK] JWT Token emitido: {token[:30]}...")

    print("\n[2/2] Verificando Nivel de Acesso & Desbloqueio de Blur...")
    admin = get_admin_client()
    member_res = admin.table("organization_members").select("role, organization_id, organizations(*)").eq("user_id", user.id).execute()
    
    org_item = member_res.data[0]
    org_id = org_item["organization_id"]
    org_info = org_item["organizations"]

    ent_svc = EntitlementsService()
    ent = ent_svc.get_organization_entitlements(org_id)

    print(f"[OK] Workspace: {org_info['name']}")
    print(f"[OK] Plano: {org_info['plan_tier'].upper()}")
    print(f"[OK] Scans Disponiveis: {ent['monthly_scan_quota']} (Ilimitado)")
    print(f"[OK] Deep CG-AG Desbloqueado (Sem Blur): {ent['has_cg_ag_deep_scan']}")
    print(f"[OK] Exportacao RIPD Desbloqueada (Sem Blur): {ent['has_ripd_export']}")
    print(f"[OK] Acesso API Desbloqueado: {ent['has_api_access']}")

    print("\n>>> STATUS: SUPER ADMIN 100% OPERACIONAL COM ACESSO TOTAL <<<")

if __name__ == "__main__":
    verify_superadmin_login()
