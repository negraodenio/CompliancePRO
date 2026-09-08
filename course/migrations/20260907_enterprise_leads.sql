-- ==============================================================================
-- Migration: 20260907_enterprise_leads.sql
-- Description: Criação da tabela enterprise_leads com RLS restrito a Service Role
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.enterprise_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT 'CISO',
    interest VARCHAR(100) DEFAULT 'enterprise_briefing',
    source VARCHAR(100) DEFAULT 'website',
    repository_context VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.enterprise_leads ENABLE ROW LEVEL SECURITY;

-- Zero políticas de SELECT para anon/authenticated (garante isolamento absoluto de PII comercial)
