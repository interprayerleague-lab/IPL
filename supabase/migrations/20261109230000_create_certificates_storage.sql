-- Create storage bucket for certificates
-- Migration: 20261109230000_create_certificates_storage.sql
-- Description: Create certificates storage bucket with RLS policies

-- Create certificates bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  false, -- Private bucket
  10485760, -- 10MB file size limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read their own certificates
CREATE POLICY "Students can view own certificates"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow service role to manage all certificates
CREATE POLICY "Service role can manage all certificates"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'certificates')
WITH CHECK (bucket_id = 'certificates');

-- Allow admin users to view all certificates
CREATE POLICY "Admins can view all certificates"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

COMMENT ON TABLE storage.objects IS 'Storage bucket policies ensure students can only access their own certificate files';
