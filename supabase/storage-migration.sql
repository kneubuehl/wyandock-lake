-- Up North — Storage Migration
-- Creates the procedure-images bucket and access policies
-- Run this in the Supabase SQL editor

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'procedure-images',
  'procedure-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload procedure images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'procedure-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update procedure images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'procedure-images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete procedure images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'procedure-images');

-- Allow public read access (bucket is public)
CREATE POLICY "Public read access for procedure images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'procedure-images');
