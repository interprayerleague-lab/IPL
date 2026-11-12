-- Migration: Create lesson_progress table
-- Description: Track student progress through lessons
-- Author: AI Agent
-- Date: 2026-11-09

-- Create lesson_progress table
CREATE TABLE public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (
        status IN ('not_started', 'in_progress', 'completed')
    ),
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (
        progress_percentage >= 0 AND progress_percentage <= 100
    ),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, lesson_id)
);

-- Create indexes
CREATE INDEX idx_lesson_progress_student_id ON public.lesson_progress(student_id);
CREATE INDEX idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_status ON public.lesson_progress(status);
CREATE INDEX idx_lesson_progress_student_lesson ON public.lesson_progress(student_id, lesson_id);

-- Create function to auto-set timestamps based on status changes
CREATE OR REPLACE FUNCTION public.update_lesson_progress_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Set started_at when status changes from not_started to in_progress
    IF OLD.status = 'not_started' AND NEW.status = 'in_progress' AND NEW.started_at IS NULL THEN
        NEW.started_at := now();
    END IF;
    
    -- Set completed_at when status changes to completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.completed_at IS NULL THEN
        NEW.completed_at := now();
        NEW.progress_percentage := 100;
    END IF;
    
    -- Always update last_accessed_at
    NEW.last_accessed_at := now();
    NEW.updated_at := now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
CREATE TRIGGER trigger_update_lesson_progress_timestamps
    BEFORE UPDATE ON public.lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_lesson_progress_timestamps();

-- Enable RLS
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view their own progress
CREATE POLICY "Students can view own lesson progress"
    ON public.lesson_progress FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- Students can insert their own progress records
CREATE POLICY "Students can create own lesson progress"
    ON public.lesson_progress FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

-- Students can update their own progress
-- Note: Completion validation should be done by backend
CREATE POLICY "Students can update own lesson progress"
    ON public.lesson_progress FOR UPDATE
    TO authenticated
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

-- Admins can view all lesson progress (for monitoring)
CREATE POLICY "Admins can view all lesson progress"
    ON public.lesson_progress FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update lesson progress (for manual corrections)
CREATE POLICY "Admins can update lesson progress"
    ON public.lesson_progress FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can insert lesson progress (for manual entries)
CREATE POLICY "Admins can create lesson progress"
    ON public.lesson_progress FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete lesson progress (for cleanup)
CREATE POLICY "Admins can delete lesson progress"
    ON public.lesson_progress FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add table comments
COMMENT ON TABLE public.lesson_progress IS 'Student progress through individual lessons';
COMMENT ON COLUMN public.lesson_progress.status IS 'Progress status: not_started, in_progress, completed';
COMMENT ON COLUMN public.lesson_progress.progress_percentage IS 'Progress percentage (0-100). Auto-set to 100 when completed';
COMMENT ON COLUMN public.lesson_progress.started_at IS 'When student first started the lesson';
COMMENT ON COLUMN public.lesson_progress.completed_at IS 'When student completed the lesson';
COMMENT ON COLUMN public.lesson_progress.last_accessed_at IS 'Last time student accessed this lesson';
