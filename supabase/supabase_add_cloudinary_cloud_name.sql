-- =====================================================
-- Migration: Add cloudinary_cloud_name to item_variants
-- & Backfill existing variants by product category
-- =====================================================

-- 1. Add column to item_variants table
ALTER TABLE public.item_variants 
ADD COLUMN IF NOT EXISTS cloudinary_cloud_name TEXT DEFAULT 'dvdxdqnie';

-- 2. Backfill existing item_variants based on parent item category (type)
-- Account 1: Tops & Kurtis (jj9xtjbf)
UPDATE public.item_variants iv
SET cloudinary_cloud_name = 'jj9xtjbf'
FROM public.items i
WHERE iv.item_id = i.id
  AND LOWER(TRIM(i.type)) IN ('top', 'kurti');

-- Account 2: One Piece & Dresses (slvabepb)
UPDATE public.item_variants iv
SET cloudinary_cloud_name = 'slvabepb'
FROM public.items i
WHERE iv.item_id = i.id
  AND LOWER(TRIM(i.type)) IN ('long_dress', 'one_piece', 'dress');

-- Account 3: Denims & Shorts (dvdxdqnie)
UPDATE public.item_variants iv
SET cloudinary_cloud_name = 'dvdxdqnie'
FROM public.items i
WHERE iv.item_id = i.id
  AND LOWER(TRIM(i.type)) IN ('bottom', 'shorts', 'denim', 'jeans');

-- Account 4: Traditional Wear & Others (wzxbak9l)
UPDATE public.item_variants iv
SET cloudinary_cloud_name = 'wzxbak9l'
FROM public.items i
WHERE iv.item_id = i.id
  AND LOWER(TRIM(i.type)) IN ('coord_set', 'other', 'traditional');

-- Set default for any remaining variants
UPDATE public.item_variants
SET cloudinary_cloud_name = 'dvdxdqnie'
WHERE cloudinary_cloud_name IS NULL;
