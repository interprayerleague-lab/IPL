-- Migration: Create quizzes, questions, attempts, and answers tables
-- Description: Assessment system with protected answer keys
-- Author: AI Agent
-- Date: 2026-11-09
-- SECURITY: Never expose correct_answer to students

-- Create quizzes table
CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    pass_mark NUMERIC(5,2) NOT NULL DEFAULT 70 CHECK (pass_mark >= 0 AND pass_mark <= 100),
    max_attempts INTEGER CHECK (max_attempts IS NULL OR max_attempts > 0),
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create questions table (correct_answer MUST NOT be exposed to students)
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false')),
    options JSONB,
    correct_answer JSONB NOT NULL,
    explanation TEXT,
    points NUMERIC(8,2) NOT NULL DEFAULT 1 CHECK (points > 0),
    sequence_number INTEGER NOT NULL CHECK (sequence_number > 0)
);

-- Create quiz_attempts table
CREATE TABLE public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
    score NUMERIC(5,2) CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    passed BOOLEAN,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (
        status IN ('in_progress', 'submitted', 'graded')
    ),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at TIMESTAMPTZ,
    UNIQUE (quiz_id, student_id, attempt_number)
);

-- Create quiz_answers table
CREATE TABLE public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    answer JSONB NOT NULL,
    awarded_points NUMERIC(8,2),
    is_correct BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (attempt_id, question_id)
);

-- Create indexes
CREATE INDEX idx_quizzes_lesson_id ON public.quizzes(lesson_id);
CREATE INDEX idx_quizzes_is_published ON public.quizzes(is_published);

CREATE INDEX idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX idx_questions_sequence_number ON public.questions(quiz_id, sequence_number);

CREATE INDEX idx_quiz_attempts_student_id ON public.quiz_attempts(student_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_status ON public.quiz_attempts(status);

CREATE INDEX idx_quiz_answers_attempt_id ON public.quiz_answers(attempt_id);
CREATE INDEX idx_quiz_answers_question_id ON public.quiz_answers(question_id);

-- Create SAFE view for students (excludes correct_answer)
CREATE VIEW public.questions_safe AS
SELECT 
    id,
    quiz_id,
    question_text,
    question_type,
    options,
    points,
    sequence_number
FROM public.questions;

-- Grant SELECT on safe view to authenticated users
GRANT SELECT ON public.questions_safe TO authenticated;

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes
-- Students can view published quizzes for published lessons
CREATE POLICY "Students can view published quizzes"
    ON public.quizzes FOR SELECT
    TO authenticated
    USING (
        is_published = true
        AND EXISTS (
            SELECT 1 FROM public.lessons l
            JOIN public.modules m ON m.id = l.module_id
            JOIN public.programmes p ON p.id = m.programme_id
            WHERE l.id = lesson_id
            AND l.is_published = true
            AND m.is_published = true
            AND p.is_published = true
        )
    );

-- Admins can view all quizzes
CREATE POLICY "Admins can view all quizzes"
    ON public.quizzes FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can INSERT/UPDATE/DELETE quizzes
CREATE POLICY "Admins can manage quizzes"
    ON public.quizzes FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for questions
-- Students CANNOT SELECT from questions table directly (use questions_safe view)
-- Admins can view all questions
CREATE POLICY "Admins can view all questions"
    ON public.questions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can INSERT/UPDATE/DELETE questions
CREATE POLICY "Admins can manage questions"
    ON public.questions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for quiz_attempts
-- Students can view their own attempts
CREATE POLICY "Students can view own quiz attempts"
    ON public.quiz_attempts FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- Students can create their own attempts
CREATE POLICY "Students can create quiz attempts"
    ON public.quiz_attempts FOR INSERT
    TO authenticated
    WITH CHECK (
        student_id = auth.uid()
        AND status = 'in_progress'
        AND score IS NULL
        AND passed IS NULL
    );

-- Students can update their own in_progress attempts (to submit)
CREATE POLICY "Students can submit quiz attempts"
    ON public.quiz_attempts FOR UPDATE
    TO authenticated
    USING (
        student_id = auth.uid()
        AND status = 'in_progress'
    )
    WITH CHECK (
        student_id = auth.uid()
        AND score IS NULL
        AND passed IS NULL
    );

-- Admins can view all attempts
CREATE POLICY "Admins can view all quiz attempts"
    ON public.quiz_attempts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can manage attempts
CREATE POLICY "Admins can manage quiz attempts"
    ON public.quiz_attempts FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for quiz_answers
-- Students can view their own answers after grading
CREATE POLICY "Students can view own quiz answers"
    ON public.quiz_answers FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.quiz_attempts
            WHERE id = attempt_id AND student_id = auth.uid()
        )
    );

-- Students can insert answers for their own in_progress attempts
CREATE POLICY "Students can submit answers"
    ON public.quiz_answers FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quiz_attempts
            WHERE id = attempt_id 
            AND student_id = auth.uid()
            AND status = 'in_progress'
        )
        AND awarded_points IS NULL
        AND is_correct IS NULL
    );

-- Admins can view all answers
CREATE POLICY "Admins can view all quiz answers"
    ON public.quiz_answers FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can manage answers
CREATE POLICY "Admins can manage quiz answers"
    ON public.quiz_answers FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add table comments
COMMENT ON TABLE public.quizzes IS 'Quiz definitions with pass marks and attempt limits';
COMMENT ON TABLE public.questions IS 'Quiz questions with correct answers (PROTECTED from students)';
COMMENT ON TABLE public.quiz_attempts IS 'Student quiz attempts with scores (backend-graded only)';
COMMENT ON TABLE public.quiz_answers IS 'Student answers (grading fields are backend-controlled)';
COMMENT ON VIEW public.questions_safe IS 'SAFE view of questions WITHOUT correct answers for students';
COMMENT ON COLUMN public.questions.correct_answer IS 'SECURITY: Never expose to students. Backend grading only.';
COMMENT ON COLUMN public.quiz_attempts.score IS 'SECURITY: Backend-calculated only. Students cannot set.';
COMMENT ON COLUMN public.quiz_attempts.passed IS 'SECURITY: Backend-determined only.';
COMMENT ON COLUMN public.quiz_answers.awarded_points IS 'SECURITY: Backend-graded only.';
COMMENT ON COLUMN public.quiz_answers.is_correct IS 'SECURITY: Backend-determined only.';
