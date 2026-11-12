-- Migration: Create applications and enrollments tables
-- Description: Student application workflow and enrollment management
-- Author: AI Agent
-- Date: 2026-11-09

-- Create applications table
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    application_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (
        status IN ('draft', 'submitted', 'under_review', 'additional_information_required', 'approved', 'rejected', 'withdrawn')
    ),
    personal_information JSONB NOT NULL DEFAULT '{}',
    motivation TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create enrollments table  
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    programme_id UUID NOT NULL, -- FK will be added after programmes table exists
    cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
    application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'active', 'completed', 'suspended', 'withdrawn')
    ),
    enrolled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_applications_student_id ON public.applications(student_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_created_at ON public.applications(created_at DESC);
CREATE INDEX idx_applications_application_number ON public.applications(application_number);

CREATE INDEX idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_programme_id ON public.enrollments(programme_id);
CREATE INDEX idx_enrollments_status ON public.enrollments(status);
CREATE INDEX idx_enrollments_cohort_id ON public.enrollments(cohort_id);

-- Create unique constraint for active enrollments (prevent duplicates)
CREATE UNIQUE INDEX idx_enrollments_student_programme_active 
    ON public.enrollments(student_id, programme_id) 
    WHERE status IN ('pending', 'active');

-- Create function to generate application number
CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_part TEXT;
    new_number TEXT;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT LPAD((COUNT(*) + 1)::TEXT, 5, '0')
    INTO sequence_part
    FROM public.applications
    WHERE application_number LIKE year_part || '-%';
    
    new_number := year_part || '-' || sequence_part;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate application number
CREATE OR REPLACE FUNCTION public.set_application_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.application_number IS NULL OR NEW.application_number = '' THEN
        NEW.application_number := public.generate_application_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_application_number
    BEFORE INSERT ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.set_application_number();

-- Attach updated_at trigger to applications
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for applications
-- Students can view their own applications
CREATE POLICY "Students can view own applications"
    ON public.applications FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- Students can insert their own applications
CREATE POLICY "Students can create applications"
    ON public.applications FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid() AND status = 'draft');

-- Students can update their own draft applications
CREATE POLICY "Students can update own draft applications"
    ON public.applications FOR UPDATE
    TO authenticated
    USING (
        student_id = auth.uid() 
        AND status IN ('draft', 'additional_information_required')
    )
    WITH CHECK (
        student_id = auth.uid()
        AND reviewed_by IS NULL
        AND reviewed_at IS NULL
        AND review_notes IS NULL
    );

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
    ON public.applications FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all applications
CREATE POLICY "Admins can update applications"
    ON public.applications FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can insert applications on behalf of students
CREATE POLICY "Admins can create applications"
    ON public.applications FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for enrollments
-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
    ON public.enrollments FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments"
    ON public.enrollments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can insert enrollments
CREATE POLICY "Admins can create enrollments"
    ON public.enrollments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update enrollments
CREATE POLICY "Admins can update enrollments"
    ON public.enrollments FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete enrollments
CREATE POLICY "Admins can delete enrollments"
    ON public.enrollments FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add table comments
COMMENT ON TABLE public.applications IS 'Student applications with workflow: draft → submitted → under_review → approved/rejected';
COMMENT ON TABLE public.enrollments IS 'Confirmed student enrollments linking students to programmes and cohorts';
COMMENT ON COLUMN public.applications.status IS 'Application workflow status';
COMMENT ON COLUMN public.applications.personal_information IS 'Flexible JSONB storage for application form data';
COMMENT ON COLUMN public.enrollments.status IS 'Enrollment lifecycle: pending → active → completed/suspended/withdrawn';
