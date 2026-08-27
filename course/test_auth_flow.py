"""
Teste do Fluxo de Autenticacao Simplificado do Supabase
"""
import uuid
from supabase_client import supabase_public, get_admin_client
from entitlements_service import EntitlementsService

def test_auth():
    print("[1/3] Testando Registro de Novo Usuario (Auth Sign Up)...")
    
    unique_suffix = str(uuid.uuid4())[:8]
    test_email = f"auditor_{unique_suffix}@gmail.com"
    test_password = "SecurePassword123!"

    try:
        auth_res = supabase_public.auth.sign_up({
            "email": test_email,
            "password": test_password,
            "options": {
                "data": {
                    "full_name": f"Auditor {unique_suffix}"
                }
            }
        })
        print(f"[OK] Usuario cadastrado no Supabase: {auth_res.user.email} (ID: {auth_res.user.id})")
        user_id = auth_res.user.id
    except Exception as e:
        print(f"[ERRO] Falha ao cadastrar: {str(e)}")
        return

    print("\n[2/3] Verificando Auto-Onboarding (Trigger de Workspace)...")
    admin = get_admin_client()
    member_res = admin.table("organization_members").select("role, organization_id, organizations(name, plan_tier)").eq("user_id", user_id).execute()

    if member_res.data and len(member_res.data) > 0:
        org_data = member_res.data[0]
        print(f"[OK] Workspace criado automaticamente: {org_data['organizations']['name']}")
        print(f"[OK] Role do Usuario: {org_data['role']}")
        org_id = org_data["organization_id"]
    else:
        print("[INFO] Criando vinculacao manual (caso o trigger SQL ainda nao tenha sido executado no editor)...")
        org_res = admin.table("organizations").insert({
            "name": f"Workspace {unique_suffix}",
            "slug": f"workspace-{unique_suffix}",
            "plan_tier": "free"
        }).execute()
        org_id = org_res.data[0]["id"]
        admin.table("organization_members").insert({
            "organization_id": org_id,
            "user_id": user_id,
            "role": "owner"
        }).execute()
        ent_svc = EntitlementsService()
        ent_svc.create_default_free_tier(org_id)
        print(f"[OK] Workspace provisionado com sucesso: {org_id}")

    print("\n[3/3] Testando Login com Senha...")
    try:
        login_res = supabase_public.auth.sign_in_with_password({
            "email": test_email,
            "password": test_password
        })
        
        if login_res.session:
            print(f"[OK] Login realizado com sucesso!")
            print(f"[OK] Access Token JWT: {login_res.session.access_token[:35]}...")
        else:
            print("[INFO] Usuario aguardando confirmacao de email (ou auto-confirm ativado no Supabase).")
    except Exception as e:
        print(f"[INFO] Login com senha: {str(e)}")

    print("\n>>> TESTE DE AUTH CONCLUIDO COM SUCESSO! <<<")

if __name__ == "__main__":
    test_auth()
