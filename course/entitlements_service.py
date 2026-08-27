from typing import Dict, Any, Optional
from uuid import UUID
from datetime import datetime
from supabase_client import get_admin_client

class EntitlementsService:
    """
    Serviço Guardião de Cotas & Módulos (Entitlements).
    Desacopla o scanner de sistemas de pagamento (Stripe/Asaas).
    """

    def __init__(self):
        self.client = get_admin_client()

    def get_organization_entitlements(self, org_id: str) -> Optional[Dict[str, Any]]:
        """Busca as cotas e permissões ativas da organização."""
        response = self.client.table("entitlements").select("*").eq("organization_id", org_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    def can_run_scan(self, org_id: str, is_deep_cg_ag: bool = False) -> tuple[bool, str]:
        """
        Verifica se a organização tem cota disponível para executar um scan.
        Retorna (autorizado: bool, motivo_ou_erro: str).
        """
        entitlement = self.get_organization_entitlements(org_id)
        
        if not entitlement:
            return False, "Organização não possui plano de entitlements configurado."

        if not entitlement.get("is_active", False):
            return False, "Plano ou assinatura da organização está inativa ou suspensa."

        # Checa cota mensal
        used = entitlement.get("used_scans_period", 0)
        quota = entitlement.get("monthly_scan_quota", 0)

        if used >= quota:
            return False, f"Limite mensal de scans atingido ({used}/{quota}). Faça upgrade para continuar."

        # Checa acesso ao módulo avançado CG-AG
        if is_deep_cg_ag and not entitlement.get("has_cg_ag_deep_scan", False):
            return False, "Módulo de Avaliação CG-AG Deep Scan não incluso no plano atual."

        return True, "Autorizado"

    def record_scan_usage(self, org_id: str) -> bool:
        """Incrementa o uso de scan consumido pela organização."""
        entitlement = self.get_organization_entitlements(org_id)
        if not entitlement:
            return False

        new_usage = entitlement.get("used_scans_period", 0) + 1
        self.client.table("entitlements").update({
            "used_scans_period": new_usage,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("organization_id", org_id).execute()
        
        return True

    def create_default_free_tier(self, org_id: str) -> Dict[str, Any]:
        """Cria o plano gratuito padrão para novas organizações cadastradas."""
        payload = {
            "organization_id": org_id,
            "monthly_scan_quota": 5,
            "used_scans_period": 0,
            "has_cg_ag_deep_scan": True,
            "has_ripd_export": True,
            "has_api_access": False,
            "is_active": True
        }
        res = self.client.table("entitlements").insert(payload).execute()
        return res.data[0] if res.data else {}
