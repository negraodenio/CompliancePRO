from typing import Dict, Any, List, Optional
from supabase_client import get_admin_client

class ScanStorageService:
    """
    Persistência de Resultados de Auditoria no PostgreSQL (Supabase).
    REGRA FUNDAMENTAL: Apenas metadados, scores, evidências e findings.
    NUNCA armazena o código-fonte proprietário do cliente.
    """

    def __init__(self):
        self.client = get_admin_client()

    def create_or_get_repository(self, org_id: str, repo_name: str, repo_type: str = "zip_upload") -> str:
        """Cria ou recupera o ID de um repositório da organização."""
        existing = self.client.table("repositories").select("id").eq("organization_id", org_id).eq("name", repo_name).execute()
        if existing.data and len(existing.data) > 0:
            return existing.data[0]["id"]

        new_repo = self.client.table("repositories").insert({
            "organization_id": org_id,
            "name": repo_name,
            "repo_type": repo_type
        }).execute()
        return new_repo.data[0]["id"]

    def save_scan_result(
        self,
        org_id: str,
        repository_id: str,
        compliance_score: float,
        risk_level: str,
        frameworks_breakdown: Dict[str, Any],
        cg_ag_assessment: Optional[Dict[str, Any]] = None,
        findings: Optional[List[Dict[str, Any]]] = None,
        total_files: int = 0,
        total_agents: int = 0,
        summary_report: str = "",
        triggered_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """Salva a execução do scan e seus achados normalizados."""
        
        # 1. Registra o Scan Principal
        scan_payload = {
            "organization_id": org_id,
            "repository_id": repository_id,
            "triggered_by": triggered_by,
            "scanner_version": "1.0.0-light",
            "compliance_score": compliance_score,
            "risk_level": risk_level,
            "total_files_analyzed": total_files,
            "total_agents_detected": total_agents,
            "frameworks_breakdown": frameworks_breakdown,
            "cg_ag_assessment": cg_ag_assessment or {},
            "summary_report": summary_report
        }
        scan_res = self.client.table("scans").insert(scan_payload).execute()
        scan_record = scan_res.data[0]
        scan_id = scan_record["id"]

        # 2. Registra os Achados (Findings) de forma normalizada
        if findings and len(findings) > 0:
            findings_payload = []
            for f in findings:
                findings_payload.append({
                    "scan_id": scan_id,
                    "organization_id": org_id,
                    "rule_id": f.get("rule_id", "UNKNOWN"),
                    "severity": f.get("severity", "MEDIUM"),
                    "file_path": f.get("file_path", ""),
                    "line_number": f.get("line_number"),
                    "issue_description": f.get("description", ""),
                    "remediation_suggestion": f.get("remediation", "")
                })
            self.client.table("scan_findings").insert(findings_payload).execute()

        return scan_record
