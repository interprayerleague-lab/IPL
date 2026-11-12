-- Migration: Create branches and cohorts tables
-- Description: Organizational structure for multiple branches and student cohorts
-- Author: AI Agent
-- Date: 2026-11-09

-- Create branches table
CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create cohorts table
CREATE TABLE public.cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'planned' 
        CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_branches_is_active ON public.branches(is_active);
CREATE INDEX idx_cohorts_branch_id ON public.cohorts(branch_id);
CREATE INDEX idx_cohorts_status ON public.cohorts(status);

-- Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for branches
-- Students can view active branches
CREATE POLICY "Students can view active branches"
    ON public.branches FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Admins can view all branches
CREATE POLICY "Admins can view all branches"
    ON public.branches FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can insert branches
CREATE POLICY "Admins can insert branches"
    ON public.branches FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update branches
CREATE POLICY "Admins can update branches"
    ON public.branches FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete branches
CREATE POLICY "Admins can delete branches"
    ON public.branches FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for cohorts
-- Students can view cohorts
CREATE POLICY "Students can view cohorts"
    ON public.cohorts FOR SELECT
    TO authenticated
    USING (true);

-- Admins can view all cohorts
CREATE POLICY "Admins can view all cohorts"
    ON public.cohorts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can insert cohorts
CREATE POLICY "Admins can insert cohorts"
    ON public.cohorts FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update cohorts
CREATE POLICY "Admins can update cohorts"
    ON public.cohorts FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete cohorts
CREATE POLICY "Admins can delete cohorts"
    ON public.cohorts FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add table comments
COMMENT ON TABLE public.branches IS 'Organizational branches/locations where the school operates';
COMMENT ON TABLE public.cohorts IS 'Student cohorts - groups taking a programme together';
COMMENT ON COLUMN public.cohorts.status IS 'Cohort lifecycle: planned, active, completed, cancelled';
