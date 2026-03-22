-- ============================================================
-- HireAI — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor to initialize the database
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;  -- pgvector for semantic search

-- ─── Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    phone       TEXT,
    role        TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')) DEFAULT 'candidate',
    avatar_url  TEXT,
    company     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Jobs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jobs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title                   TEXT NOT NULL,
    description             TEXT NOT NULL,
    requirements            TEXT[] DEFAULT '{}',
    requirements_embedding  vector(3072),  -- text-embedding-3-large dimension
    location                TEXT NOT NULL,
    job_type                TEXT DEFAULT 'full_time',
    salary_min              INTEGER NOT NULL DEFAULT 0,
    salary_max              INTEGER NOT NULL DEFAULT 0,
    department              TEXT,
    experience_min          INTEGER DEFAULT 0,
    experience_max          INTEGER,
    status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'closed', 'archived')),
    created_by              UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_jobs_embedding 
    ON public.jobs USING ivfflat (requirements_embedding vector_cosine_ops)
    WITH (lists = 100);

-- ─── Applications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.applications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id          UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    candidate_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    candidate_email TEXT NOT NULL,
    resume_url      TEXT,
    parsed_data     JSONB,
    match_score     FLOAT CHECK (match_score >= 0 AND match_score <= 1),
    status          TEXT NOT NULL DEFAULT 'applied' CHECK (
        status IN ('applied', 'screening', 'invited', 'scheduled', 'interviewed', 'shortlisted', 'rejected', 'offer_sent', 'hired')
    ),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(job_id, candidate_email)
);

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON public.applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_match_score ON public.applications(match_score DESC);

-- ─── Interviews ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    scheduled_at    TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'scheduled' CHECK (
        status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')
    ),
    unique_link     TEXT,
    unique_token    TEXT UNIQUE,
    transcript      JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON public.interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON public.interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON public.interviews(scheduled_at);

-- ─── Assessments ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assessments (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id          UUID UNIQUE NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
    technical_score       FLOAT DEFAULT 0 CHECK (technical_score >= 0 AND technical_score <= 100),
    behavioral_score      FLOAT DEFAULT 0 CHECK (behavioral_score >= 0 AND behavioral_score <= 100),
    communication_score   FLOAT DEFAULT 0 CHECK (communication_score >= 0 AND communication_score <= 100),
    cultural_fit_score    FLOAT DEFAULT 0 CHECK (cultural_fit_score >= 0 AND cultural_fit_score <= 100),
    overall_score         FLOAT DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
    expected_salary       INTEGER,
    negotiated_salary     INTEGER,
    verdict               TEXT CHECK (verdict IN ('strong_hire', 'hire', 'no_hire', 'strong_no_hire')),
    verdict_reasoning     TEXT,
    key_strengths         TEXT[] DEFAULT '{}',
    areas_of_improvement  TEXT[] DEFAULT '{}',
    round_summaries       JSONB DEFAULT '[]',
    detailed_report       JSONB DEFAULT '{}',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_interview_id ON public.assessments(interview_id);
CREATE INDEX IF NOT EXISTS idx_assessments_verdict ON public.assessments(verdict);
CREATE INDEX IF NOT EXISTS idx_assessments_overall_score ON public.assessments(overall_score DESC);

-- ─── Triggers: auto-update updated_at ────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security (RLS) ────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile; recruiters can view all
CREATE POLICY "users_select" ON public.users
    FOR SELECT USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('recruiter', 'admin')
    ));

-- Jobs are publicly readable
CREATE POLICY "jobs_select_public" ON public.jobs
    FOR SELECT USING (status = 'active');

CREATE POLICY "jobs_recruiter_all" ON public.jobs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('recruiter', 'admin'))
    );

-- Candidates can see their own applications; recruiters see all
CREATE POLICY "applications_candidate" ON public.applications
    FOR SELECT USING (candidate_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('recruiter', 'admin')));

-- Interviews visible to candidate and recruiter
CREATE POLICY "interviews_participant" ON public.interviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id 
            AND (a.candidate_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('recruiter', 'admin')))
        )
    );

-- Assessments visible to recruiters only
CREATE POLICY "assessments_recruiter" ON public.assessments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('recruiter', 'admin'))
    );

-- ─── Useful Views ─────────────────────────────────────────────
CREATE OR REPLACE VIEW public.candidate_pipeline AS
SELECT 
    a.id AS application_id,
    a.status,
    a.match_score,
    a.created_at AS applied_at,
    u.name AS candidate_name,
    u.email AS candidate_email,
    u.phone AS candidate_phone,
    j.title AS job_title,
    j.department,
    i.id AS interview_id,
    i.scheduled_at,
    i.status AS interview_status,
    asmnt.overall_score,
    asmnt.verdict
FROM public.applications a
JOIN public.users u ON u.id = a.candidate_id
JOIN public.jobs j ON j.id = a.job_id
LEFT JOIN public.interviews i ON i.application_id = a.id
LEFT JOIN public.assessments asmnt ON asmnt.interview_id = i.id
ORDER BY a.match_score DESC;

-- ─── Function: semantic resume search ────────────────────────
CREATE OR REPLACE FUNCTION match_candidates_for_job(
    job_embedding vector(3072),
    match_threshold float DEFAULT 0.75,
    match_count int DEFAULT 20
)
RETURNS TABLE (
    application_id UUID,
    candidate_name TEXT,
    match_score FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        u.name,
        1 - (j.requirements_embedding <=> job_embedding) AS score
    FROM applications a
    JOIN users u ON u.id = a.candidate_id
    JOIN jobs j ON j.id = a.job_id
    WHERE 1 - (j.requirements_embedding <=> job_embedding) > match_threshold
    ORDER BY score DESC
    LIMIT match_count;
END;
$$;
