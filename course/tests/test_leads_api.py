"""
test_leads_api.py

Automated test suite for Enterprise Leads API (POST /api/v1/leads)
Requirements:
1. Supabase success -> 201 Created
2. Supabase failure -> Fail-closed: does NOT return 201 (returns 503)
3. Webhook failure after persistence -> Lead remains safely saved (returns 201)
4. Public client cannot read leads (no GET endpoint / 405 Method Not Allowed)
5. Input validation (invalid email, missing required fields -> 422)
"""

import sys
import unittest
from unittest.mock import MagicMock, patch
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main_api import app

client = TestClient(app)

class TestEnterpriseLeadsAPI(unittest.TestCase):

    def setUp(self):
        self.valid_payload = {
            "full_name": "Dra. Juliana Silveira",
            "email": "juliana@fintechbrasil.com.br",
            "company": "FinTech Brasil S/A",
            "role": "CISO",
            "interest": "enterprise_briefing",
            "source": "website",
            "notes": "DemonstraÃ§Ã£o personalizada de esteira CI/CD"
        }

    @patch("main_api.get_admin_client")
    def test_lead_persistence_supabase_success_returns_201(self, mock_get_admin):
        """1. Supabase success -> 201 Created and confirms persistence"""
        mock_admin = MagicMock()
        mock_table = MagicMock()
        mock_insert = MagicMock()
        mock_exec = MagicMock()

        # Simulate successful Supabase insert returning the inserted row with ID
        mock_exec.data = [{"id": "lead-uuid-12345", "full_name": "Dra. Juliana Silveira"}]
        mock_insert.execute.return_value = mock_exec
        mock_table.insert.return_value = mock_insert
        mock_admin.table.return_value = mock_table
        mock_get_admin.return_value = mock_admin

        response = client.post("/api/v1/leads", json=self.valid_payload)

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["status"], "created")
        self.assertEqual(data["lead_id"], "lead-uuid-12345")
        mock_table.insert.assert_called_once()

    @patch("main_api.get_admin_client")
    def test_lead_persistence_supabase_failure_fails_closed_never_201(self, mock_get_admin):
        """2. Supabase failure -> Fail-closed: does NOT return 201; returns 503 sanitized error"""
        mock_admin = MagicMock()
        mock_table = MagicMock()
        # Simulate Supabase downtime or network exception
        mock_table.insert.side_effect = Exception("Supabase connection timeout")
        mock_admin.table.return_value = mock_table
        mock_get_admin.return_value = mock_admin

        response = client.post("/api/v1/leads", json=self.valid_payload)

        self.assertNotEqual(response.status_code, 201)
        self.assertEqual(response.status_code, 503)
        self.assertIn("NÃ£o foi possÃ­vel salvar o contato no momento", response.json()["detail"])

    @patch("main_api.get_admin_client")
    @patch("httpx.post")
    def test_webhook_failure_after_persistence_preserves_lead(self, mock_httpx_post, mock_get_admin):
        """3. Optional webhook failure after persistence -> lead remains saved with 201"""
        mock_admin = MagicMock()
        mock_table = MagicMock()
        mock_insert = MagicMock()
        mock_exec = MagicMock()
        mock_exec.data = [{"id": "lead-uuid-webhook-test"}]
        mock_insert.execute.return_value = mock_exec
        mock_table.insert.return_value = mock_insert
        mock_admin.table.return_value = mock_table
        mock_get_admin.return_value = mock_admin

        # Simulate webhook failure
        mock_httpx_post.side_effect = Exception("Slack/CRM webhook endpoint 500 error")

        with patch.dict("os.environ", {"LEADS_WEBHOOK_URL": "https://hooks.slack.com/services/mock"}):
            response = client.post("/api/v1/leads", json=self.valid_payload)

        # Webhook failure MUST NOT invalidate the saved lead
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["lead_id"], "lead-uuid-webhook-test")

    def test_public_client_cannot_read_leads(self):
        """4. Public client cannot read leads: GET /api/v1/leads must be 405 Method Not Allowed"""
        response = client.get("/api/v1/leads")
        self.assertEqual(response.status_code, 405)

    def test_input_validation_invalid_email_returns_422(self):
        """5. Input validation rejects invalid email"""
        invalid_payload = self.valid_payload.copy()
        invalid_payload["email"] = "not-a-valid-email"

        response = client.post("/api/v1/leads", json=invalid_payload)
        self.assertEqual(response.status_code, 422)

    def test_input_validation_missing_required_fields_returns_422(self):
        """6. Input validation rejects missing company"""
        invalid_payload = self.valid_payload.copy()
        del invalid_payload["company"]

        response = client.post("/api/v1/leads", json=invalid_payload)
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
