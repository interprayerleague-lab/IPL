-- Migration: Create programmes, modules, and lessons tables
-- Description: Learning content structure with ordered modules and lessons
-- Author: AI Agent
-- Date: 2026-11-09

-- Create programmes table
CREATE TABLE public.programmes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    cover_image_path TEXT,
    duration_weeks INTEGER CHECK (duration_weeks IS NULL OR duration_weeks > 0),
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create modules table
CREATE TABLE public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_id UUID NOT NULL REFERENCES public.programmes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    learning_objectives JSONB NOT NULL DEFAULT '[]',
    sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (programme_id, sequence_number),
    UNIQUE (programme_id, slug)
);

-- Create lessons table
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    content JSONB,
    video_url TEXT,
    duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
    sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
    is_required BOOLEAN NOT NULL DEFAULT true,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (module_id, sequence_number),
    UNIQUE (module_id, slug)
);

-- Add foreign key constraint to enrollments.programme_id (now that programmes table exists)
ALTER TABLE public.enrollments 
    ADD CONSTRAINT enrollments_programme_id_fkey 
    FOREIGN KEY (programme_id) REFERENCES public.programmes(id) ON DELETE RESTRICT;

-- Create indexes
CREATE INDEX idx_programmes_slug ON public.programmes(slug);
CREATE INDEX idx_programmes_is_published ON public.programmes(is_published);
CREATE INDEX idx_programmes_created_by ON public.programmes(created_by);

CREATE INDEX idx_modules_programme_id ON public.modules(programme_id);
CREATE INDEX idx_modules_sequence_number ON public.modules(programme_id, sequence_number);
CREATE INDEX idx_modules_is_published ON public.modules(is_published);

CREATE INDEX idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX idx_lessons_sequence_number ON public.lessons(module_id, sequence_number);
CREATE INDEX idx_lessons_is_published ON public.lessons(is_published);
CREATE INDEX idx_lessons_is_required ON public.lessons(is_required);

-- Attach updated_at triggers
CREATE TRIGGER update_programmes_updated_at
    BEFORE UPDATE ON public.programmes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_modules_updated_at
    BEFORE UPDATE ON public.modules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON public.lessons
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for programmes
-- Students can view published programmes
CREATE POLICY "Students can view published programmes"
    ON public.programmes FOR SELECT
    TO authenticated
    USING (is_published = true);

-- Admins can view all programmes
CREATE POLICY "Admins can view all programmes"
    ON public.programmes FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can insert programmes
CREATE POLICY "Admins can create programmes"
    ON public.programmes FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update programmes
CREATE POLICY "Admins can update programmes"
    ON public.programmes FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete programmes
CREATE POLICY "Admins can delete programmes"
    ON public.programmes FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for modules
-- Students can view published modules in published programmes
CREATE POLICY "Students can view published modules"
    ON public.modules FOR SELECT
    TO authenticated
    USING (
        is_published = true 
        AND EXISTS (
            SELECT 1 FROM public.programmes
            WHERE id = programme_id AND is_published = true
        )
    );

-- Admins can view all modules
CREATE POLICY "Admins can view all modules"
    ON public.modules FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can insert modules
CREATE POLICY "Admins can create modules"
    ON public.modules FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update modules
CREATE POLICY "Admins can update modules"
    ON public.modules FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete modules
CREATE POLICY "Admins can delete modules"
    ON public.modules FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for lessons
-- Students can view published lessons in published modules of published programmes
CREATE POLICY "Students can view published lessons"
    ON public.lessons FOR SELECT
    TO authenticated
    USING (
        is_published = true 
        AND EXISTS (
            SELECT 1 FROM public.modules m
            JOIN public.programmes p ON p.id = m.programme_id
            WHERE m.id = module_id 
            AND m.is_published = true 
            AND p.is_published = true
        )
    );

-- Admins can view all lessons
CREATE POLICY "Admins can view all lessons"
    ON public.lessons FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can insert lessons
CREATE POLICY "Admins can create lessons"
    ON public.lessons FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update lessons
CREATE POLICY "Admins can update lessons"
    ON public.lessons FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete lessons
CREATE POLICY "Admins can delete lessons"
    ON public.lessons FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add table comments
COMMENT ON TABLE public.programmes IS 'Learning programmes containing ordered modules';
COMMENT ON TABLE public.modules IS 'Programme modules containing ordered lessons';
COMMENT ON TABLE public.lessons IS 'Individual lessons with content, videos, and resources';
COMMENT ON COLUMN public.programmes.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN public.modules.learning_objectives IS 'Array of learning objectives for this module';
COMMENT ON COLUMN public.modules.sequence_number IS 'Order within programme (1, 2, 3...)';
COMMENT ON COLUMN public.lessons.content IS 'Structured lesson content in JSONB format';
COMMENT ON COLUMN public.lessons.sequence_number IS 'Order within module (1, 2, 3...)';
COMMENT ON COLUMN public.lessons.is_required IS 'Whether lesson must be completed to unlock next module';
