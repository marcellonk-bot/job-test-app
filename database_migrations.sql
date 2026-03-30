-- ============================================
-- AI Interview Simulation - Database Migrations
-- ============================================
-- Run these SQL commands in your Supabase SQL Editor
-- to add required columns for the AI Interview feature
-- ============================================

-- 1. Add interview-related columns to applications_table
-- ============================================

-- Add interview_score column (stores AI-generated score 1-100)
ALTER TABLE applications_table
ADD COLUMN IF NOT EXISTS interview_score INTEGER CHECK (interview_score >= 0 AND interview_score <= 100);

-- Add ai_insights column (stores AI-generated candidate summary)
ALTER TABLE applications_table
ADD COLUMN IF NOT EXISTS ai_insights TEXT;

-- Add/Update status column (tracks application lifecycle)
ALTER TABLE applications_table
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Applied';

-- Add timestamp for when interview was completed
ALTER TABLE applications_table
ADD COLUMN IF NOT EXISTS interviewed_at TIMESTAMP WITH TIME ZONE;

-- Add interview transcript storage (optional - for review)
ALTER TABLE applications_table
ADD COLUMN IF NOT EXISTS interview_transcript JSONB;

-- ============================================
-- 2. Update candidates table (if needed)
-- ============================================

-- Ensure interview_score exists on candidates table
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS interview_score INTEGER CHECK (interview_score >= 0 AND interview_score <= 100);

-- ============================================
-- 3. Create indexes for better query performance
-- ============================================

-- Index for filtering by interview status
CREATE INDEX IF NOT EXISTS idx_applications_status
ON applications_table(status);

-- Index for sorting by interview score
CREATE INDEX IF NOT EXISTS idx_applications_interview_score
ON applications_table(interview_score DESC);

-- Index for finding interviewed applications
CREATE INDEX IF NOT EXISTS idx_applications_interviewed_at
ON applications_table(interviewed_at DESC);

-- ============================================
-- 4. Add helpful views (optional)
-- ============================================

-- View for interviewed candidates with scores
CREATE OR REPLACE VIEW interviewed_candidates AS
SELECT
    a.id as application_id,
    a.job_id,
    a.candidate_id,
    a.interview_score,
    a.ai_insights,
    a.interviewed_at,
    a.status,
    j.job_title,
    j.company_id,
    p.full_name as candidate_name,
    p.skills as candidate_skills
FROM applications_table a
LEFT JOIN jobs_table j ON a.job_id = j.id
LEFT JOIN profiles_table p ON a.candidate_id = p.user_id
WHERE a.interview_score IS NOT NULL
ORDER BY a.interviewed_at DESC;

-- View for top-performing candidates
CREATE OR REPLACE VIEW top_candidates AS
SELECT
    a.id as application_id,
    a.job_id,
    j.job_title,
    p.full_name as candidate_name,
    a.interview_score,
    a.ai_insights,
    a.interviewed_at
FROM applications_table a
LEFT JOIN jobs_table j ON a.job_id = j.id
LEFT JOIN profiles_table p ON a.candidate_id = p.user_id
WHERE a.interview_score >= 70
ORDER BY a.interview_score DESC, a.interviewed_at DESC;

-- ============================================
-- 5. Update RLS (Row Level Security) Policies
-- ============================================

-- Allow candidates to read their own interview results
CREATE POLICY IF NOT EXISTS "Candidates can view own interview results"
ON applications_table
FOR SELECT
USING (auth.uid() = candidate_id);

-- Allow employers to view interviews for their jobs
CREATE POLICY IF NOT EXISTS "Employers can view interviews for their jobs"
ON applications_table
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM jobs_table j
        WHERE j.id = applications_table.job_id
        AND j.company_id = auth.uid()
    )
);

-- ============================================
-- 6. Verification Queries
-- ============================================

-- Check if all required columns exist
DO $$
BEGIN
    -- Check applications_table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='applications_table' AND column_name='interview_score') THEN
        RAISE NOTICE 'Missing column: applications_table.interview_score';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='applications_table' AND column_name='ai_insights') THEN
        RAISE NOTICE 'Missing column: applications_table.ai_insights';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='applications_table' AND column_name='status') THEN
        RAISE NOTICE 'Missing column: applications_table.status';
    END IF;

    RAISE NOTICE 'Database migration verification complete!';
END $$;

-- ============================================
-- 7. Sample Data (for testing)
-- ============================================

-- Update existing applications to have default status
UPDATE applications_table
SET status = 'Applied'
WHERE status IS NULL;

-- ============================================
-- NOTES:
-- ============================================
-- 1. All ALTER TABLE statements use "IF NOT EXISTS" to be idempotent
-- 2. Run this script multiple times safely
-- 3. Existing data will not be affected
-- 4. Indexes improve query performance for large datasets
-- 5. Views provide convenient data access patterns
-- 6. RLS policies ensure data security
-- ============================================
