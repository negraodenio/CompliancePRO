"""
Script de Provisionamento do Super Admin / Acesso Total (Sem Blur / Sem Limites)
Email: negraodenio@gmail.com
"""
import os
from supabase_client import get_admin_client

SUPERADMIN_EMAIL = "negraodenio@gmail.com"
ADMIN_PASSWORD = "CompliancePROMaster2026!" # Senha inicial segura de administrador

def setup_superadmin():
    print(f"=== PROVISIONANDO SUPER ADMIN: {SUPERADMIN_EMAIL} ===")
    admin = get_admin_client()

    # 1. Verifica se o usuario ja existe no Supabase Auth
    user_id = None
    try:
        # Busca lista de usuarios
        users_list = admin.auth.admin.list_users()
        for u in users_list:
            if u.email == SUPERADMIN_EMAIL:
                user_id = u.id
                print(f"[OK] Usuario encontrado no Supabase Auth (ID: {user_id})")
                break
    except Exception as e:
        print(f"[INFO] Buscando/Criando usuario: {str(e)}")

    # Se nao existir, cria o usuario com confirmacao automatica de email
    if not user_id:
        try:
            created_user = admin.auth.admin.create_user({
                "email": SUPERADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": "Dênio Negrão (Super Admin)",
                    "is_superadmin": True
                }
            })
            user_id = created_user.user.id
            print(f"[OK] Usuario {SUPERADMIN_EMAIL} criado com sucesso no Auth! (ID: {user_id})")
        except Exception as e:
            print(f"[AVISO] Tentativa de criacao: {str(e)}")

    # 2. Cria ou Recupera a Organizacao Master Admin
    master_slug = "compliancepro-master-admin"
    org_res = admin.table("organizations").select("*").eq("slug", master_slug).execute()

    if org_res.data and len(org_res.data) > 0:
        org_id = org_res.data[0]["id"]
        # Atualiza para Enterprise
        admin.table("organizations").update({
            "name": "CompliancePRO Master HQ (Full Access)",
            "plan_tier": "enterprise"
        }).eq("id", org_id).execute()
        print(f"[OK] Workspace Master atualizado (ID: {org_id})")
    else:
        new_org = admin.table("organizations").insert({
            "name": "CompliancePRO Master HQ (Full Access)",
            "slug": master_slug,
            "plan_tier": "enterprise"
        }).execute()
        org_id = new_org.data[0]["id"]
        print(f"[OK] Novo Workspace Master criado (ID: {org_id})")

    # 3. Associa o usuario como OWNER / SUPERADMIN
    if user_id:
        member_res = admin.table("organization_members").select("*")\
            .eq("organization_id", org_id)\
            .eq("user_id", user_id)\
            .execute()

        if not member_res.data:
            admin.table("organization_members").insert({
                "organization_id": org_id,
                "user_id": user_id,
                "role": "owner"
            }).execute()
            print("[OK] Permissao de OWNER vinculada no Workspace Master.")

    # 4. Configura ENTITLEMENTS ILIMITADOS (Acesso Total / Sem Blur / Sem Restricoes)
    ent_res = admin.table("entitlements").select("*").eq("organization_id", org_id).execute()
    
    ent_payload = {
        "organization_id": org_id,
        "monthly_scan_quota": 999999,      # Scans ilimitados
        "used_scans_period": 0,
        "has_cg_ag_deep_scan": True,       # Acesso Total CG-AG (Sem Blur)
        "has_ripd_export": True,           # Emissao Total de RIPD (Sem Blur)
        "has_api_access": True,            # API CI/CD liberada
        "is_active": True
    }

    if ent_res.data and len(ent_res.data) > 0:
        admin.table("entitlements").update(ent_payload).eq("organization_id", org_id).execute()
        print("[OK] Entitlements atualizados para FULL ACCESS (999.999 scans + Zero Blur).")
    else:
        admin.table("entitlements").insert(ent_payload).execute()
        print("[OK] Entitlements criados com FULL ACCESS (999.999 scans + Zero Blur).")

    print("\n========================================================")
    print("✨ SUPER ADMIN CONFIGURADO COM SUCESSO!")
    print(f"📧 Email: {SUPERADMIN_EMAIL}")
    print(f"🔑 Senha Inicial: {ADMIN_PASSWORD}")
    print("🔓 Acesso: FULL ENTERPRISE (Sem blur em nenhum modulo)")
    print("========================================================")

if __name__ == "__main__":
    setup_superadmin()
