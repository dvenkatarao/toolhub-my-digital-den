-- Create storage bucket for user files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-files',
  'user-files',
  false,
  524288000, -- 500MB max file size
  ARRAY[
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/*',
    'application/zip',
    'application/x-rar-compressed'
  ]
);

-- Storage policies for user files
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create files metadata table
CREATE TABLE public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  size bigint NOT NULL,
  type text NOT NULL,
  storage_path text NOT NULL,
  folder text DEFAULT 'root',
  is_favorite boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on files table
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- RLS policies for files table
CREATE POLICY "Users can view their own files metadata"
ON public.files
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files metadata"
ON public.files
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files metadata"
ON public.files
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files metadata"
ON public.files
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create shared files table for file sharing
CREATE TABLE public.shared_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email text NOT NULL,
  permission text NOT NULL CHECK (permission IN ('view', 'edit')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on shared files table
ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for shared files
CREATE POLICY "Users can view files shared with them"
ON public.shared_files
FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id OR
  auth.jwt()->>'email' = shared_with_email
);

CREATE POLICY "File owners can share their files"
ON public.shared_files
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "File owners can manage sharing"
ON public.shared_files
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- Create indexes for better performance
CREATE INDEX idx_files_user_id ON public.files(user_id);
CREATE INDEX idx_files_folder ON public.files(folder);
CREATE INDEX idx_files_created_at ON public.files(created_at DESC);
CREATE INDEX idx_shared_files_file_id ON public.shared_files(file_id);
CREATE INDEX idx_shared_files_email ON public.shared_files(shared_with_email);

-- Create trigger for updated_at
CREATE TRIGGER update_files_updated_at
BEFORE UPDATE ON public.files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();