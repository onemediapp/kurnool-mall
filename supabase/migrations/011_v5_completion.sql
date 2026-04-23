-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 011 — v5 completion: indexes, trigger, storage, extensions
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Required extensions (pg_trgm already enabled in 001) ───────
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─── 2. Performance indexes ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_vendor_available
  ON public.products(vendor_id, is_available)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_products_category_available
  ON public.products(category_id, is_available)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_orders_customer_created
  ON public.orders(customer_id, created_at DESC)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_orders_vendor_status
  ON public.orders(vendor_id, status)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON public.orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vendors_kyc_active
  ON public.vendors(kyc_status, is_active)
  WHERE is_deleted = FALSE;

-- ─── 3. Auto-update vendor rating on review insert/update ──────────
-- reviews table defined in 003_enhancements.sql has no is_deleted column;
-- aggregate all rows. If is_deleted is later added, update this function.
CREATE OR REPLACE FUNCTION public.update_vendor_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.vendors SET
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM public.reviews
      WHERE vendor_id = NEW.vendor_id
    ), 0),
    rating_count = (
      SELECT COUNT(*) FROM public.reviews
      WHERE vendor_id = NEW.vendor_id
    ),
    updated_at = NOW()
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_review_insert ON public.reviews;
CREATE TRIGGER after_review_insert
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_vendor_rating();

-- ─── 4. Banners storage bucket + policies ──────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('banners', 'banners', TRUE, 5242880,
        ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "banners_public_read" ON storage.objects;
CREATE POLICY "banners_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "banners_admin_write" ON storage.objects;
CREATE POLICY "banners_admin_write" ON storage.objects
  FOR ALL USING (
    bucket_id = 'banners'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'banners'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
