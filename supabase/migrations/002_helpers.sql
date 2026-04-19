-- ============================================================
-- KURNOOL MALL — Helpers, RPCs, Seeds, Storage
-- Migration: 002_helpers.sql
-- ============================================================

-- ─── RPC: decrement_stock ─────────────────────────────────

CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.products
  SET
    stock_qty    = GREATEST(0, stock_qty - p_quantity),
    is_available = CASE WHEN GREATEST(0, stock_qty - p_quantity) = 0 THEN FALSE ELSE is_available END,
    updated_at   = NOW()
  WHERE id = p_product_id;
END;
$$;

-- Restrict to service_role only
REVOKE ALL ON FUNCTION decrement_stock(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER) TO service_role;

-- ─── RPC: increment_stock (for cancellations) ─────────────

CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.products
  SET
    stock_qty    = stock_qty + p_quantity,
    is_available = TRUE,
    updated_at   = NOW()
  WHERE id = p_product_id;
END;
$$;

REVOKE ALL ON FUNCTION increment_stock(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_stock(UUID, INTEGER) TO service_role;

-- ─── RPC: get_vendor_stats ────────────────────────────────

CREATE OR REPLACE FUNCTION get_vendor_stats(p_vendor_id UUID)
RETURNS TABLE (
  total_orders     BIGINT,
  pending_orders   BIGINT,
  delivered_orders BIGINT,
  total_gmv        DECIMAL(12,2),
  avg_rating       DECIMAL(3,2),
  total_products   BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(o.id)                                                          AS total_orders,
    COUNT(o.id) FILTER (WHERE o.status = 'pending')                     AS pending_orders,
    COUNT(o.id) FILTER (WHERE o.status = 'delivered')                   AS delivered_orders,
    COALESCE(SUM(o.grand_total) FILTER (WHERE o.status = 'delivered'), 0) AS total_gmv,
    COALESCE((SELECT v.rating FROM public.vendors v WHERE v.id = p_vendor_id), 0) AS avg_rating,
    (SELECT COUNT(*) FROM public.products p WHERE p.vendor_id = p_vendor_id AND p.is_deleted = FALSE) AS total_products
  FROM public.orders o
  WHERE o.vendor_id = p_vendor_id AND o.is_deleted = FALSE;
END;
$$;

REVOKE ALL ON FUNCTION get_vendor_stats(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_vendor_stats(UUID) TO authenticated;

-- ─── SEED CATEGORIES (idempotent) ─────────────────────────

INSERT INTO public.categories (id, name_en, name_te, slug, sort_order, is_active) VALUES
  ('11111111-0000-0000-0000-000000000001','Grocery & Essentials','కిరాణా సరుకులు','grocery',1,TRUE),
  ('11111111-0000-0000-0000-000000000002','Electronics','ఎలక్ట్రానిక్స్','electronics',2,TRUE),
  ('11111111-0000-0000-0000-000000000003','Fashion & Apparel','దుస్తులు','fashion',3,TRUE),
  ('11111111-0000-0000-0000-000000000004','Electricals','ఎలక్ట్రికల్స్','electricals',4,TRUE),
  ('11111111-0000-0000-0000-000000000005','Plumbing','ప్లంబింగ్','plumbing',5,TRUE),
  ('11111111-0000-0000-0000-000000000006','Building Materials','నిర్మాణ సామగ్రి','building-materials',6,TRUE),
  ('11111111-0000-0000-0000-000000000007','Office Stationery','స్టేషనరీ','stationery',7,TRUE),
  ('11111111-0000-0000-0000-000000000008','Sweets & Snacks','స్వీట్లు మరియు స్నాక్స్','sweets-snacks',8,TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── STORAGE BUCKETS ──────────────────────────────────────

-- Product images (public bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  TRUE,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Vendor documents (private bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-documents',
  'vendor-documents',
  FALSE,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ─── STORAGE RLS POLICIES ─────────────────────────────────

-- Product images: authenticated INSERT under products/{vendor_id}/...
CREATE POLICY "product_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND name LIKE 'products/%'
  );

-- Product images: public SELECT
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Vendor documents: vendor uploads own documents
CREATE POLICY "vendor_docs_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vendor-documents'
    AND name LIKE (auth.uid()::TEXT || '/%')
  );

-- Vendor documents: admin reads all
CREATE POLICY "vendor_docs_admin_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'vendor-documents'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Vendor documents: vendor reads own
CREATE POLICY "vendor_docs_own_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'vendor-documents'
    AND name LIKE (auth.uid()::TEXT || '/%')
  );
