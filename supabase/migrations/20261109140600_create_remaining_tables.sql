-- Migration: Create remaining tables (resources, payments, announcements, notifications, certificates, audit_logs)
-- Description: Complete the database schema
-- Author: AI Agent
-- Date: 2026-11-09

-- Create resources table
CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT,
    external_url TEXT,
    resource_type TEXT NOT NULL CHECK (
        resource_type IN ('document', 'video', 'link', 'audio', 'other')
    ),
    is_downloadable BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (file_path IS NOT NULL OR external_url IS NOT NULL)
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
    currency TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_reference TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'successful', 'failed', 'refunded', 'cancelled')
    ),
    verified_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create announcements table
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (
        target_type IN ('all', 'programme', 'cohort', 'individual')
    ),
    target_id UUID,
    published_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    related_entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create certificates table
CREATE TABLE public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    certificate_number TEXT UNIQUE NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL,
    file_path TEXT,
    status TEXT NOT NULL DEFAULT 'issued' CHECK (
        status IN ('issued', 'revoked')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (enrollment_id)
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_resources_lesson_id ON public.resources(lesson_id);
CREATE INDEX idx_resources_resource_type ON public.resources(resource_type);

CREATE INDEX idx_payments_student_id ON public.payments(student_id);
CREATE INDEX idx_payments_enrollment_id ON public.payments(enrollment_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_provider_reference ON public.payments(provider_reference);

CREATE INDEX idx_announcements_is_published ON public.announcements(is_published);
CREATE INDEX idx_announcements_published_at ON public.announcements(published_at DESC);
CREATE INDEX idx_announcements_target_type ON public.announcements(target_type);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE INDEX idx_certificates_student_id ON public.certificates(student_id);
CREATE INDEX idx_certificates_certificate_number ON public.certificates(certificate_number);
CREATE INDEX idx_certificates_enrollment_id ON public.certificates(enrollment_id);

CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resources
CREATE POLICY "Students can view resources for published lessons"
    ON public.resources FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.lessons l
            JOIN public.modules m ON m.id = l.module_id
            JOIN public.programmes p ON p.id = m.programme_id
            WHERE l.id = lesson_id
            AND l.is_published = true
            AND m.is_published = true
            AND p.is_published = true
        )
    );

CREATE POLICY "Admins can manage resources"
    ON public.resources FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for payments
CREATE POLICY "Students can view own payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

CREATE POLICY "Admins can view all payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage payments"
    ON public.payments FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for announcements
CREATE POLICY "Students can view published targeted announcements"
    ON public.announcements FOR SELECT
    TO authenticated
    USING (
        is_published = true
        AND (published_at IS NULL OR published_at <= now())
        AND (expires_at IS NULL OR expires_at > now())
        AND (
            target_type = 'all'
            OR (target_type = 'individual' AND target_id = auth.uid())
            OR (target_type = 'programme' AND EXISTS (
                SELECT 1 FROM public.enrollments
                WHERE student_id = auth.uid() AND programme_id = target_id
            ))
            OR (target_type = 'cohort' AND EXISTS (
                SELECT 1 FROM public.enrollments
                WHERE student_id = auth.uid() AND cohort_id = target_id
            ))
        )
    );

CREATE POLICY "Admins can manage announcements"
    ON public.announcements FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own notification read state"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage notifications"
    ON public.notifications FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for certificates
CREATE POLICY "Students can view own issued certificates"
    ON public.certificates FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() AND status = 'issued');

CREATE POLICY "Admins can manage certificates"
    ON public.certificates FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add table comments
COMMENT ON TABLE public.resources IS 'Learning resources (files, videos, links) attached to lessons';
COMMENT ON TABLE public.payments IS 'Payment records with provider verification (backend-verified only)';
COMMENT ON TABLE public.announcements IS 'Announcements targeted to all, programme, cohort, or individual';
COMMENT ON TABLE public.notifications IS 'User notifications with read/unread state';
COMMENT ON TABLE public.certificates IS 'Programme completion certificates (admin-issued only)';
COMMENT ON TABLE public.audit_logs IS 'Audit trail of admin actions (append-only)';

COMMENT ON COLUMN public.payments.amount_minor IS 'Amount in smallest currency unit (e.g., cents for USD)';
COMMENT ON COLUMN public.payments.status IS 'SECURITY: Only backend can verify and update payment status';
COMMENT ON COLUMN public.certificates.certificate_number IS 'Unique certificate identifier';
COMMENT ON COLUMN public.certificates.status IS 'Certificate status: issued or revoked';
