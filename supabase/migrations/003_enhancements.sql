-- ════════════════════════════════════════════════════════════
-- MIGRATION 003: Enhancement tables for Kurnool Mall v2.0
-- ════════════════════════════════════════════════════════════

-- ── Step 1: Add coupon columns to orders ────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_id   UUID,
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- ── Step 2: Riders table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.riders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  phone            TEXT NOT NULL UNIQUE,
  vehicle_type     TEXT NOT NULL DEFAULT 'bike' CHECK (vehicle_type IN ('bike','scooter','cycle')),
  is_online        BOOLEAN NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  current_lat      DECIMAL(10,8),
  current_lng      DECIMAL(11,8),
  rating           DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  total_earnings   DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active riders" ON public.riders;
CREATE POLICY "Public reads active riders" ON public.riders
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin manages riders" ON public.riders;
CREATE POLICY "Admin manages riders" ON public.riders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Step 3: Banners table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en    TEXT NOT NULL,
  title_te    TEXT NOT NULL DEFAULT '',
  subtitle_en TEXT,
  subtitle_te TEXT,
  image_url   TEXT NOT NULL DEFAULT '',
  cta_url     TEXT,
  cta_text_en TEXT,
  cta_text_te TEXT,
  bg_color    TEXT DEFAULT '#1E3A5F',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active banners" ON public.banners;
CREATE POLICY "Public reads active banners" ON public.banners
  FOR SELECT USING (
    is_active = TRUE
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at > NOW())
  );

DROP POLICY IF EXISTS "Admin manages banners" ON public.banners;
CREATE POLICY "Admin manages banners" ON public.banners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Step 4: Coupons table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code               TEXT NOT NULL UNIQUE,
  discount_type      TEXT NOT NULL CHECK (discount_type IN ('flat','percent')),
  discount_value     DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount   DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_discount_amount DECIMAL(10,2),
  usage_limit        INTEGER,
  used_count         INTEGER NOT NULL DEFAULT 0,
  per_user_limit     INTEGER NOT NULL DEFAULT 1,
  vendor_id          UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  category_id        UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  new_users_only     BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active coupons" ON public.coupons;
CREATE POLICY "Public reads active coupons" ON public.coupons
  FOR SELECT USING (
    is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (usage_limit IS NULL OR used_count < usage_limit)
  );

DROP POLICY IF EXISTS "Admin manages coupons" ON public.coupons;
CREATE POLICY "Admin manages coupons" ON public.coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Step 5: Coupon usages ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id  UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coupon_id, order_id)
);

ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own usages" ON public.coupon_usages;
CREATE POLICY "Users see own usages" ON public.coupon_usages
  FOR SELECT USING (user_id = auth.uid());

-- ── Step 6: Add FK from orders to coupons ───────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_coupon_id_fkey'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_coupon_id_fkey
      FOREIGN KEY (coupon_id) REFERENCES public.coupons(id);
  END IF;
END $$;

-- ── Step 7: Flash sales table ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flash_sales (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en         TEXT NOT NULL,
  title_te         TEXT NOT NULL DEFAULT '',
  product_id       UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id        UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  discount_percent DECIMAL(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 90),
  original_price   DECIMAL(10,2) NOT NULL,
  sale_price       DECIMAL(10,2) NOT NULL,
  stock_qty        INTEGER NOT NULL DEFAULT 50,
  sold_qty         INTEGER NOT NULL DEFAULT 0,
  starts_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at          TIMESTAMPTZ NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active flash sales" ON public.flash_sales;
CREATE POLICY "Public reads active flash sales" ON public.flash_sales
  FOR SELECT USING (
    is_active = TRUE AND starts_at <= NOW() AND ends_at > NOW()
  );

DROP POLICY IF EXISTS "Admin manages flash sales" ON public.flash_sales;
CREATE POLICY "Admin manages flash sales" ON public.flash_sales
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Step 8: Loyalty accounts ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  points_balance  INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  points_lifetime INTEGER NOT NULL DEFAULT 0,
  tier            TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','platinum')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own loyalty" ON public.loyalty_accounts;
CREATE POLICY "Users read own loyalty" ON public.loyalty_accounts
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin reads all loyalty" ON public.loyalty_accounts;
CREATE POLICY "Admin reads all loyalty" ON public.loyalty_accounts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Step 9: Loyalty transactions ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id      UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type          TEXT NOT NULL CHECK (type IN ('earn','redeem','bonus','expire','adjustment')),
  points        INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description   TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own loyalty txns" ON public.loyalty_transactions;
CREATE POLICY "Users read own loyalty txns" ON public.loyalty_transactions
  FOR SELECT USING (user_id = auth.uid());

-- ── Step 10: Reviews table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vendor_id            UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  product_id           UUID REFERENCES public.products(id) ON DELETE SET NULL,
  rating               INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment              TEXT,
  vendor_reply         TEXT,
  vendor_replied_at    TIMESTAMPTZ,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, customer_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads reviews" ON public.reviews;
CREATE POLICY "Public reads reviews" ON public.reviews
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Customers create reviews" ON public.reviews;
CREATE POLICY "Customers create reviews" ON public.reviews
  FOR INSERT WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Vendors reply to reviews" ON public.reviews;
CREATE POLICY "Vendors reply to reviews" ON public.reviews
  FOR UPDATE USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );

-- ── Step 11: Wishlists table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own wishlist" ON public.wishlists;
CREATE POLICY "Users manage own wishlist" ON public.wishlists
  FOR ALL USING (user_id = auth.uid());

-- ── Step 12: Notifications table ────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('order','promo','system','loyalty')),
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  data       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role inserts notifications" ON public.notifications;
CREATE POLICY "Service role inserts notifications" ON public.notifications
  FOR INSERT WITH CHECK (TRUE);

-- ── Step 13: Vendor payouts table ────────────────────────────
CREATE TABLE IF NOT EXISTS public.vendor_payouts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id         UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  total_gmv         DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_commission  DECIMAL(10,2) NOT NULL DEFAULT 0,
  gst_on_commission DECIMAL(10,2) NOT NULL DEFAULT 0,
  tcs_deducted      DECIMAL(10,2) NOT NULL DEFAULT 0,
  refunds_deducted  DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_payout        DECIMAL(10,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','on_hold')),
  utr_number        TEXT,
  notes             TEXT,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors read own payouts" ON public.vendor_payouts;
CREATE POLICY "Vendors read own payouts" ON public.vendor_payouts
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin manages payouts" ON public.vendor_payouts;
CREATE POLICY "Admin manages payouts" ON public.vendor_payouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Step 14: Enable Realtime on new tables ───────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ── Step 15: RPC validate_coupon ─────────────────────────────
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code        TEXT,
  p_user_id     UUID,
  p_order_total DECIMAL,
  p_vendor_id   UUID DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_coupon        public.coupons%ROWTYPE;
  v_usage_count   INTEGER;
  v_discount      DECIMAL := 0;
  v_is_new_user   BOOLEAN;
BEGIN
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (usage_limit IS NULL OR used_count < usage_limit);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', FALSE, 'message', 'Invalid or expired coupon code');
  END IF;

  IF p_order_total < v_coupon.min_order_amount THEN
    RETURN jsonb_build_object('valid', FALSE, 'message',
      'Minimum order of ₹' || v_coupon.min_order_amount::TEXT || ' required');
  END IF;

  IF v_coupon.vendor_id IS NOT NULL AND v_coupon.vendor_id IS DISTINCT FROM p_vendor_id THEN
    RETURN jsonb_build_object('valid', FALSE, 'message', 'Coupon not valid for this vendor');
  END IF;

  SELECT COUNT(*) INTO v_usage_count
  FROM public.coupon_usages
  WHERE coupon_id = v_coupon.id AND user_id = p_user_id;

  IF v_usage_count >= v_coupon.per_user_limit THEN
    RETURN jsonb_build_object('valid', FALSE, 'message', 'You have already used this coupon');
  END IF;

  IF v_coupon.new_users_only THEN
    SELECT NOT EXISTS(
      SELECT 1 FROM public.orders
      WHERE customer_id = p_user_id AND status = 'delivered'
    ) INTO v_is_new_user;
    IF NOT v_is_new_user THEN
      RETURN jsonb_build_object('valid', FALSE, 'message', 'Coupon valid for new customers only');
    END IF;
  END IF;

  IF v_coupon.discount_type = 'percent' THEN
    v_discount := LEAST(
      p_order_total * v_coupon.discount_value / 100,
      COALESCE(v_coupon.max_discount_amount, 99999)
    );
  ELSE
    v_discount := LEAST(v_coupon.discount_value, p_order_total);
  END IF;

  RETURN jsonb_build_object(
    'valid',           TRUE,
    'coupon_id',       v_coupon.id,
    'discount_amount', ROUND(v_discount, 2),
    'message',         'Coupon applied! You save ₹' || ROUND(v_discount, 2)::TEXT
  );
END;
$$;

REVOKE ALL ON FUNCTION validate_coupon FROM PUBLIC;
GRANT EXECUTE ON FUNCTION validate_coupon TO authenticated;

-- ── Step 16: RPC get_platform_stats ──────────────────────────
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'gmv_today',
      COALESCE(SUM(CASE WHEN DATE(o.created_at AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE
                        AND o.status != 'cancelled' THEN o.grand_total END), 0),
    'gmv_yesterday',
      COALESCE(SUM(CASE WHEN DATE(o.created_at AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE - 1
                        AND o.status != 'cancelled' THEN o.grand_total END), 0),
    'orders_today',
      COUNT(CASE WHEN DATE(o.created_at AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE THEN 1 END),
    'orders_pending',
      COUNT(CASE WHEN o.status = 'pending' THEN 1 END),
    'orders_in_progress',
      COUNT(CASE WHEN o.status IN ('accepted','preparing','ready','out_for_delivery') THEN 1 END),
    'orders_delivered_today',
      COUNT(CASE WHEN DATE(o.updated_at AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE
                      AND o.status = 'delivered' THEN 1 END),
    'active_vendors',
      (SELECT COUNT(*) FROM public.vendors WHERE is_active = TRUE),
    'online_vendors',
      (SELECT COUNT(*) FROM public.vendors WHERE is_active = TRUE),
    'active_riders',
      (SELECT COUNT(*) FROM public.riders WHERE is_active = TRUE AND is_online = TRUE),
    'new_customers_today',
      (SELECT COUNT(*) FROM public.users
       WHERE DATE(created_at AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE AND role = 'customer'),
    'payment_success_rate', 98.5,
    'avg_delivery_time_minutes', 45
  ) INTO v_result FROM public.orders o;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION get_platform_stats FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_platform_stats TO authenticated;

-- ── Step 17: RPC get_vendor_stats (enhanced) ─────────────────
CREATE OR REPLACE FUNCTION get_vendor_stats(p_vendor_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_orders',       COUNT(*),
    'pending_orders',     COUNT(CASE WHEN status = 'pending' THEN 1 END),
    'delivered_orders',   COUNT(CASE WHEN status = 'delivered' THEN 1 END),
    'cancelled_orders',   COUNT(CASE WHEN status IN ('cancelled','rejected') THEN 1 END),
    'total_gmv',          COALESCE(SUM(CASE WHEN status = 'delivered' THEN grand_total END), 0),
    'total_commission',   COALESCE(SUM(CASE WHEN status = 'delivered'
                            THEN grand_total * (
                              SELECT commission_rate FROM public.vendors WHERE id = p_vendor_id
                            ) / 100 END), 0),
    'net_earnings',       COALESCE(SUM(CASE WHEN status = 'delivered'
                            THEN grand_total * (1 - (
                              SELECT commission_rate FROM public.vendors WHERE id = p_vendor_id
                            ) / 100) END), 0),
    'avg_rating',         (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE vendor_id = p_vendor_id),
    'total_products',     (SELECT COUNT(*) FROM public.products WHERE vendor_id = p_vendor_id),
    'active_products',    (SELECT COUNT(*) FROM public.products WHERE vendor_id = p_vendor_id AND is_available = TRUE),
    'low_stock_products', (SELECT COUNT(*) FROM public.products WHERE vendor_id = p_vendor_id AND stock_qty <= 5),
    'acceptance_rate',    CASE WHEN COUNT(*) > 0
                            THEN ROUND(COUNT(CASE WHEN status != 'rejected' THEN 1 END)::DECIMAL / COUNT(*) * 100, 1)
                            ELSE 100 END,
    'orders_today',       COUNT(CASE WHEN DATE(created_at AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE THEN 1 END),
    'gmv_today',          COALESCE(SUM(CASE WHEN DATE(created_at AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE
                                          AND status = 'delivered' THEN grand_total END), 0)
  ) INTO v_result
  FROM public.orders
  WHERE vendor_id = p_vendor_id;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION get_vendor_stats FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_vendor_stats TO authenticated;

-- ── Step 18: Seed default banners ────────────────────────────
INSERT INTO public.banners (title_en, title_te, subtitle_en, bg_color, sort_order, is_active)
VALUES
  ('Same Day Delivery', 'అదే రోజు డెలివరీ', 'Order by 4 PM, delivered today!', '#1E3A5F', 1, TRUE),
  ('Local Sweets & Snacks', 'స్థానిక స్వీట్లు', 'Authentic Kurnool flavours at your door', '#D97706', 2, TRUE),
  ('Electricals & Plumbing', 'ఎలక్ట్రికల్స్', 'All hardware, delivered same day', '#16A34A', 3, TRUE)
ON CONFLICT DO NOTHING;
