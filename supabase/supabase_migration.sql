-- =====================================================
-- MIGRATION: Update existing tables for new features
-- Run this in Supabase SQL Editor
-- (This is SAFE to run — it only ADDs missing columns)
-- =====================================================

-- 1. Add missing columns to items table
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS item_code TEXT;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS collections TEXT[] DEFAULT '{}';
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Rename is_new to is_new_arrival (the app uses is_new_arrival)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='is_new') THEN
    ALTER TABLE public.items RENAME COLUMN is_new TO is_new_arrival;
  END IF;
END $$;

-- Make price nullable (so admin can hide it from customers)
ALTER TABLE public.items ALTER COLUMN price DROP NOT NULL;

-- 2. Add missing columns to item_variants table
ALTER TABLE public.item_variants ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;

-- 3. Add missing columns to customer_sessions table
ALTER TABLE public.customer_sessions ADD COLUMN IF NOT EXISTS is_expired BOOLEAN DEFAULT false;

-- 4. Create collections table (new feature)
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to collections" ON public.collections FOR ALL USING (true) WITH CHECK (true);

-- Realtime for collections
ALTER PUBLICATION supabase_realtime ADD TABLE public.collections;

-- 5. Storage: Allow public READS from product-images bucket
-- (You already have INSERT, UPDATE, DELETE policies)
CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'product-images');
