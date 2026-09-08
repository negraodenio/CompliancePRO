# COMPLYPRO â€” ENTERPRISE POD TECHNICAL BRIEF
## Dedicated Single-Tenant Architecture & Air-Gapped Deployment Specification

**Version:** 1.0.0
**Target Audience:** Enterprise CISOs, Cloud Architecture Teams, Security & Compliance Officers
**Deployment Model:** Dedicated Single-Tenant Containerized POD (Virtual Private Cloud / Air-Gapped)

---

## 1. Executive Overview

ComplyPRO offers two operational delivery models:
1. **ComplyPRO SaaS (Multi-Tenant Managed):** Cloud-hosted control plane featuring logical tenant isolation, PostgreSQL Row Level Security (RLS), and managed infrastructure.
2. **ComplyPRO Enterprise POD (Dedicated Single-Tenant):** Self-contained, single-tenant containerized deployment running inside the customer's dedicated VPC, private cloud, or air-gapped on-premises environment.

The Enterprise POD model ensures that **all scan executions, governance ledgers, risk evaluations, and AI agent inventories remain strictly within the customer's security boundary**.

---

## 2. Architecture & Container Topology

The ComplyPRO Enterprise POD consists of three containerized services packaged as OCI-compliant container images:

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ CUSTOMER ENTERPRISE VPC / PRIVATE PERIMETER                                  â”‚
â”‚                                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                                                   â”‚
â”‚  â”‚   Customer Network    â”‚                                                   â”‚
â”‚  â”‚  Reverse Proxy / WAF  â”‚ (TLS Termination & Internal SSO / Reverse Proxy)  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                                                   â”‚
â”‚              â”‚                                                               â”‚
â”‚       â”Œâ”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                           â”‚
â”‚       â”‚                                          â”‚                           â”‚
â”‚       â–¼                                          â–¼                           â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”             â”‚
â”‚ â”‚   complypro-web:latest    â”‚      â”‚   complypro-api:latest    â”‚             â”‚
â”‚ â”‚  (React SPA / Nginx Host) â”‚      â”‚   (FastAPI Core Engine)   â”‚             â”‚
â”‚ â”‚  Port: 80 / 443           â”‚      â”‚   Port: 8000              â”‚             â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜             â”‚
â”‚                                                  â”‚                           â”‚
â”‚                                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”             â”‚
â”‚                                    â”‚                           â”‚             â”‚
â”‚                                    â–¼                           â–¼             â”‚
â”‚                      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚                      â”‚    Dedicated PostgreSQL   â”‚ â”‚  complypro-mcp:latest â”‚ â”‚
â”‚                      â”‚  (RDS / Supabase / Local) â”‚ â”‚  (Universal MCP SSE)  â”‚ â”‚
â”‚                      â”‚  Customer-Managed KMS     â”‚ â”‚  Port: 3001           â”‚ â”‚
â”‚                      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 2.1 Component Specifications

| Service | Technology | Role | Network Scope |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | Nginx / React SPA | Static asset server for governance consoles | Ingress from internal VPN/SSO |
| **Core API** | Python 3.11+ / FastAPI | Multi-tenant or single-tenant governance backend | Internal VPC |
| **Universal MCP** | Node.js 20+ / TypeScript | Model Context Protocol server (SSE / Stdio) | Internal VPC / IDE bridge |
| **Database** | PostgreSQL 15+ / Supabase | Audit ledger, findings, agent catalog, credentials | Private subnet (no public IP) |

---

## 3. Network Boundaries & Ingress/Egress Controls

### 3.1 Zero External Telemetry
In POD mode, ComplyPRO operates in **Strict Air-Gapped Mode**:
- **No phoning home:** Zero external analytics, tracking pixels, or heartbeat telemetry to ComplyPRO servers.
- **No external CDN dependencies:** All JavaScript, fonts, and stylesheets are bundled directly into the container image.
- **Local AST Scanning:** Static code analysis occurs strictly within browser memory and/or the local container runtime. Raw source code is **never transmitted across network boundaries**.

### 3.2 Ingress Security
- All incoming HTTP traffic is terminated via the enterprise reverse proxy (e.g., AWS ALB, Cloudflare Access, Envoy, Nginx).
- Authentication via JWT / API Keys with tenant isolation strictly enforced at the database level.
- Rate-limiting and strict CORS headers configured exclusively for internal corporate domains.

### 3.3 Egress Restrictions
- The POD requires **zero outbound internet access** for core scanner and governance features.
- If optional integration with remote LLMs (e.g. Azure OpenAI, OpenRouter) is enabled for automated remediation suggestions, egress is restricted to specific approved IP/FQDN endpoints via corporate egress proxy.

---

## 4. Data Persistence & Encryption

### 4.1 Storage & Schema Isolation
- Enterprise customers maintain complete physical and logical custody over the underlying PostgreSQL database.
- Row Level Security (RLS) is enabled across all tables (`organizations`, `scans`, `scan_findings`, `enterprise_leads`, `entitlements`).
- Database backups, retention windows, and replication are fully controlled by the enterprise DBA team.

### 4.2 Encryption at Rest & In Transit
- **In Transit:** TLS 1.3 enforced for all internal and external communication.
- **At Rest:** Database volumes encrypted using Customer-Managed Keys (AWS KMS, Azure Key Vault, or HashiCorp Vault).

---

## 5. Shared Responsibility Matrix

| Domain | Customer Responsibility | ComplyPRO Responsibility |
| :--- | :--- | :--- |
| **Physical Infrastructure** | Hardware, hypervisor, or cloud account (AWS/GCP/Azure) | N/A |
| **Container Hosting** | Docker daemon, ECS, or container runtime environment | Providing hardened, vulnerability-scanned OCI images |
| **Network & Firewall** | VPC setup, security groups, TLS certificates, DNS | Specifying port bindings and ingress/egress requirements |
| **Identity & Access** | Corporate IdP (Okta, Azure AD) integration & admin roles | Providing RBAC role enforcement in application logic |
| **Database Management** | Database provisioning, KMS encryption, backups | Providing schema migrations (`schema_supabase.sql`) |
| **Application Updates** | Pulling new container tags and restarting containers | Providing release notes, changelogs, and patch images |

---

## 6. Deployment Prerequisites & Runbook

### 6.1 Minimum Hardware Sizing
- **CPU:** 2 vCPU (4 vCPU recommended for concurrent AST scans)
- **RAM:** 4 GB (8 GB recommended)
- **Disk:** 20 GB SSD for logs and operating system
- **OS:** Any modern Linux distribution (Ubuntu 22.04 LTS, RHEL 9, Amazon Linux 2023)

### 6.2 Sample Docker Compose Configuration

```yaml
version: '3.8'

services:
  complypro-web:
    image: complypro/web:1.1.0
    restart: always
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://complypro-api:8000
    depends_on:
      - complypro-api

  complypro-api:
    image: complypro/api:1.1.0
    restart: always
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - SUPABASE_URL=http://postgres:5432
      - SUPABASE_SERVICE_ROLE_KEY=${INTERNAL_SERVICE_KEY}
    depends_on:
      - postgres

  complypro-mcp:
    image: complypro/mcp:2.0.0
    restart: always
    ports:
      - "3001:3001"
    environment:
      - TRANSPORT_MODE=sse
      - MCP_PORT=3001
      - CGAG_MCP_AUTH_TOKEN=${MCP_BEARER_TOKEN}

  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_DB=complypro
      - POSTGRES_USER=complypro_admin
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

---

## 7. Factual Clarity & Scope Boundaries

- **Containerized Standalone Deployment:** The ComplyPRO POD is delivered as a containerized stack (Docker / Docker Compose / Container Runbook).
- **No Unsubstantiated Claims:** ComplyPRO does not claim proprietary automated Kubernetes cluster autoscaling or Helm operator automation. Enterprise customers with Kubernetes infrastructure can deploy the provided OCI images using standard deployment manifests.
- **Zero Code Ingestion:** ComplyPRO never copies, stores, or replicates raw repository source files into permanent databases, ensuring complete intellectual property isolation.
