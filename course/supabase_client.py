import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Carrega estritamente o .env deste diretório
ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Configurações do Supabase não encontradas no .env!")

# Cliente Administrativo (Backend Seguro / Bypass RLS para jobs do sistema)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Cliente Público / Anônimo
supabase_public: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def get_admin_client() -> Client:
    """Retorna o cliente Supabase com privilégios de Service Role para o backend."""
    return supabase_admin

def get_tenant_client(jwt_token: str) -> Client:
    """Retorna um cliente configurado no contexto do usuário/tenant autenticado."""
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.postgrest.auth(jwt_token)
    return client
