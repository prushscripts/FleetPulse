-- Company logos bucket: in-app uploads (run in Supabase SQL Editor)
-- Creates a public bucket so logo URLs can be used in the navbar.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  1048576,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow authenticated users to upload; public read is implied by public bucket
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can update own company logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can delete company logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'company-logos');

-- Public read (for public bucket, anon can select)
CREATE POLICY "Public read company logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'company-logos');
