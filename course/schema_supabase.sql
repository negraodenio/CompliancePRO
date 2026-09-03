-- ==============================================================================
-- SCHEMA OFICIAL COMPLIANCEPRO LIGHT / SAAS
-- Multi-tenancy, Entitlements, Scans e Metadados (Zero Código de Cliente Salvo)
-- ==============================================================================

-- 1. EXTENSÃO UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ORGANIZAÇÕES (Multi-tenancy Base)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'starter', 'pro', 'enterprise'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MEMBROS DA ORGANIZAÇÃO (Mapeia auth.users do Supabase para a Organização)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'owner', -- 'owner', 'admin', 'member', 'auditor'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

-- 4. ENTITLEMENTS (Controle de Cotas, Módulos e Validade do Plano)
CREATE TABLE IF NOT EXISTS public.entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    monthly_scan_quota INT DEFAULT 5,         -- Limite de scans mensais
    used_scans_period INT DEFAULT 0,          -- Scans consumidos no mês atual
    has_cg_ag_deep_scan BOOLEAN DEFAULT true, -- Acesso ao assessment CG-AG
    has_ripd_export BOOLEAN DEFAULT true,     -- Acesso à geração de PDF do RIPD
    has_api_access BOOLEAN DEFAULT false,     -- Scan via CI/CD / API Key
    quota_resets_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. REPOSITÓRIOS / PROJETOS DE IA AUDITADOS
CREATE TABLE IF NOT EXISTS public.repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    repo_type VARCHAR(50) DEFAULT 'zip_upload', -- 'zip_upload', 'github', 'agent_pipeline'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SCANS (Metadados e Scores - SEM CÓDIGO FONTE)
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
    triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scanner_version VARCHAR(50) NOT NULL,
    compliance_score NUMERIC(5, 2) NOT NULL,    -- Ex: 92.50
    risk_level VARCHAR(20) NOT NULL,            -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    total_files_analyzed INT DEFAULT 0,
    total_agents_detected INT DEFAULT 0,
    frameworks_breakdown JSONB,                 -- Scores: {"lgpd": 95, "eu_ai_act": 88, "owasp_llm": 100}
    cg_ag_assessment JSONB,                     -- Mapeamento de Controles e Evidências
    summary_report TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ACHADOS / VULNERABILIDADES (Findings normalizados para dashboards)
CREATE TABLE IF NOT EXISTS public.scan_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    rule_id VARCHAR(100) NOT NULL,              -- Ex: "LGPD-ART-38-NO-RIPD", "OWASP-LLM-01"
    severity VARCHAR(20) NOT NULL,              -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    file_path VARCHAR(500) NOT NULL,            -- Ex: "agents/rag_orchestrator.py"
    line_number INT,
    issue_description TEXT NOT NULL,
    remediation_suggestion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - SEGURANÇA MULTI-TENANT BLINDADA
-- ==============================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_findings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their organization data" ON public.organizations;
CREATE POLICY "Users can view their organization data"
    ON public.organizations FOR SELECT
    USING (id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can view their organization members" ON public.organization_members;
CREATE POLICY "Users can view their organization members"
    ON public.organization_members FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can view their scans" ON public.scans;
CREATE POLICY "Users can view their scans"
    ON public.scans FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can view their findings" ON public.scan_findings;
CREATE POLICY "Users can view their findings"
    ON public.scan_findings FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

-- ==============================================================================
-- TRIGGER DE AUTO-ONBOARDING (AUTH -> ORGANIZAÇÃO + ENTITLEMENTS)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    org_slug VARCHAR(100);
    user_display_name VARCHAR(255);
BEGIN
    user_display_name := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1));
    org_slug := LOWER(REGEXP_REPLACE(user_display_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || SUBSTRING(NEW.id::text, 1, 8);

    -- 1. Cria a Organização Padrão
    INSERT INTO public.organizations (name, slug, plan_tier)
    VALUES (user_display_name || '''s Workspace', org_slug, 'free')
    RETURNING id INTO new_org_id;

    -- 2. Vincula usuário como OWNER
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner');

    -- 3. Cria os Entitlements Gratuitos
    INSERT INTO public.entitlements (
        organization_id,
        monthly_scan_quota,
        used_scans_period,
        has_cg_ag_deep_scan,
        has_ripd_export,
        has_api_access,
        is_active
    ) VALUES (
        new_org_id,
        5,
        0,
        true,
        true,
        true,
        true
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();
