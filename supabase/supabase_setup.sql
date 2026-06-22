-- =====================================================
-- DressMirror / Fever - Supabase Database Setup
-- Run this ENTIRE script in your Supabase SQL Editor
-- (Supabase Dashboard → SQL Editor → New Query → Paste → Run)
-- =====================================================

-- 1. Items table
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  occasions TEXT[] DEFAULT '{}',
  collections TEXT[] DEFAULT '{}',
  price NUMERIC,
  fabric TEXT DEFAULT '',
  is_new_arrival BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  godown_number TEXT DEFAULT '',
  rack_number TEXT DEFAULT '',
  shelf TEXT DEFAULT '',
  internal_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Item Variants table
CREATE TABLE IF NOT EXISTS public.item_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  colour_name TEXT NOT NULL,
  colour_hex TEXT NOT NULL DEFAULT '#000000',
  size TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  cloudinary_public_id TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  sold_at TIMESTAMPTZ
);

-- 3. Customer Sessions table
CREATE TABLE IF NOT EXISTS public.customer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT DEFAULT '',
  device_label TEXT DEFAULT 'Tablet 1',
  started_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  is_expired BOOLEAN DEFAULT false
);

-- 4. Shortlist Entries table
CREATE TABLE IF NOT EXISTS public.shortlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.customer_sessions(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.item_variants(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY,
  value TEXT
);

-- 6. Collections table
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Row Level Security (RLS) - Allow public read/write
-- (Since there is no auth, we allow all operations)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous users
CREATE POLICY "Allow all on items" ON public.items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on item_variants" ON public.item_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on customer_sessions" ON public.customer_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on shortlist_entries" ON public.shortlist_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on collections" ON public.collections FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Storage: Allow public uploads to product-images bucket
-- (You must also create the bucket in the Supabase dashboard)
-- =====================================================
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'product-images');

CREATE POLICY "Allow public deletes" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'product-images');
