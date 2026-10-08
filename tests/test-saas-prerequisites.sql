-- TEST ONLY: Supabase project wabfvgyvjeilfirumclf.
-- Exact prerequisite subset of course/schema_supabase.sql.
-- Kept outside the application migration runner; migrations 001-004 are unchanged.
-- Verify the source subset with: node tests/initialize-test-saas.mjs --source-check

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'starter', 'pro', 'enterprise'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'owner', -- 'owner', 'admin', 'member', 'auditor'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

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

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

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
