-- ════════════════════════════════════════════════════════════
-- MIGRATION 004: Services Vertical + Enterprise Admin Suite (v3)
-- ════════════════════════════════════════════════════════════

-- ── Step 0: Allow 'provider' role on users ───────────────────
-- users.role is a PostgreSQL ENUM (user_role). Add 'provider' to it.
-- Note: ALTER TYPE ADD VALUE cannot run in the same transaction that uses
-- the new value. This statement must be applied in its own migration step
-- BEFORE any DDL in this file that references role='provider' in RLS.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'provider';

-- ── Step 1: service_categories ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.service_categories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT NOT NULL UNIQUE CHECK (slug IN (
    'electrician','plumber','carpenter','ac_mechanic',
    'refrigerator_mechanic','car_mechanic','bike_mechanic',
    'house_cleaning','packers_movers','function_hall',
    'painter','pest_control','cctv_installation','inverter_ups'
  )),
  name_en        TEXT NOT NULL,
  name_te        TEXT NOT NULL DEFAULT '',
  icon           TEXT,
  emoji          TEXT NOT NULL DEFAULT '🛠️',
  description_en TEXT,
  description_te TEXT,
  base_price     DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads active service categories" ON public.service_categories;
CREATE POLICY "Public reads active service categories" ON public.service_categories
  FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admin manages service categories" ON public.service_categories;
CREATE POLICY "Admin manages service categories" ON public.service_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Step 2: service_packages ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.service_packages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id    UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name_en        TEXT NOT NULL,
  name_te        TEXT NOT NULL DEFAULT '',
  description_en TEXT,
  description_te TEXT,
  pricing_model  TEXT NOT NULL DEFAULT 'flat' CHECK (pricing_model IN ('hourly','flat','per_sqft','per_day')),
  price          DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  duration_mins  INTEGER NOT NULL DEFAULT 60,
  inclusions     JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads active service packages" ON public.service_packages;
CREATE POLICY "Public reads active service packages" ON public.service_packages
  FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admin manages service packages" ON public.service_packages;
CREATE POLICY "Admin manages service packages" ON public.service_packages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Step 3: providers ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.providers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  business_name   TEXT NOT NULL,
  bio             TEXT,
  photo_url       TEXT,
  kyc_status      TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending','approved','rejected')),
  aadhaar_masked  TEXT,
  pan_masked      TEXT,
  service_areas   TEXT[] NOT NULL DEFAULT '{}',
  category_ids    UUID[] NOT NULL DEFAULT '{}',
  rating          DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  total_jobs      INTEGER NOT NULL DEFAULT 0,
  commission_pct  DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads approved providers" ON public.providers;
CREATE POLICY "Public reads approved providers" ON public.providers
  FOR SELECT USING (kyc_status = 'approved' OR user_id = auth.uid());
DROP POLICY IF EXISTS "Provider updates self" ON public.providers;
CREATE POLICY "Provider updates self" ON public.providers
  FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admin manages providers" ON public.providers;
CREATE POLICY "Admin manages providers" ON public.providers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Step 4: provider_availability ────────────────────────────
CREATE TABLE IF NOT EXISTS public.provider_availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME NOT NULL DEFAULT '09:00',
  end_time     TIME NOT NULL DEFAULT '18:00',
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (provider_id, day_of_week)
);

ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads availability" ON public.provider_availability;
CREATE POLICY "Public reads availability" ON public.provider_availability
  FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Provider manages own availability" ON public.provider_availability;
CREATE POLICY "Provider manages own availability" ON public.provider_availability
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Step 5: service_bookings ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number   TEXT NOT NULL UNIQUE DEFAULT ('SB' || to_char(NOW(),'YYMMDD') || lpad((floor(random()*100000))::text, 5, '0')),
  customer_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id      UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  category_id      UUID NOT NULL REFERENCES public.service_categories(id),
  package_id       UUID NOT NULL REFERENCES public.service_packages(id),
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','confirmed','en_route','in_progress','completed','paid','cancelled','rejected'
  )),
  scheduled_at     TIMESTAMPTZ NOT NULL,
  address          JSONB NOT NULL,
  notes            TEXT,
  price            DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  commission       DECIMAL(10,2) NOT NULL DEFAULT 0,
  otp_hash         TEXT,
  otp_verified_at  TIMESTAMPTZ,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  cancel_reason    TEXT,
  cancelled_by     UUID REFERENCES public.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_bookings_customer ON public.service_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_provider ON public.service_bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON public.service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_scheduled ON public.service_bookings(scheduled_at);

ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer reads own bookings" ON public.service_bookings;
CREATE POLICY "Customer reads own bookings" ON public.service_bookings
  FOR SELECT USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
DROP POLICY IF EXISTS "Customer creates own booking" ON public.service_bookings;
CREATE POLICY "Customer creates own booking" ON public.service_bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS "Provider/admin updates booking" ON public.service_bookings;
CREATE POLICY "Provider/admin updates booking" ON public.service_bookings
  FOR UPDATE USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Step 6: service_booking_events (audit trail) ─────────────
CREATE TABLE IF NOT EXISTS public.service_booking_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID NOT NULL REFERENCES public.service_bookings(id) ON DELETE CASCADE,
  from_status  TEXT,
  to_status    TEXT NOT NULL,
  actor_id     UUID REFERENCES public.users(id),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_events_booking ON public.service_booking_events(booking_id);

ALTER TABLE public.service_booking_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Related parties read events" ON public.service_booking_events;
CREATE POLICY "Related parties read events" ON public.service_booking_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.service_bookings b
      WHERE b.id = booking_id
        AND (
          b.customer_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = b.provider_id AND p.user_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
        )
    )
  );

-- ── Step 7: service_reviews ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.service_reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id     UUID NOT NULL UNIQUE REFERENCES public.service_bookings(id) ON DELETE CASCADE,
  customer_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id    UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  rating         INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  provider_reply TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads service reviews" ON public.service_reviews;
CREATE POLICY "Public reads service reviews" ON public.service_reviews
  FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Customer inserts own review" ON public.service_reviews;
CREATE POLICY "Customer inserts own review" ON public.service_reviews
  FOR INSERT WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS "Provider replies to review" ON public.service_reviews;
CREATE POLICY "Provider replies to review" ON public.service_reviews
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );

-- ── Step 8: function_halls + hall_bookings ───────────────────
CREATE TABLE IF NOT EXISTS public.function_halls (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  description_en TEXT,
  description_te TEXT,
  capacity       INTEGER NOT NULL DEFAULT 100,
  price_per_day  DECIMAL(10,2) NOT NULL CHECK (price_per_day >= 0),
  amenities      TEXT[] NOT NULL DEFAULT '{}',
  images         TEXT[] NOT NULL DEFAULT '{}',
  address_line   TEXT NOT NULL,
  city           TEXT NOT NULL DEFAULT 'Kurnool',
  owner_user_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.function_halls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads active halls" ON public.function_halls;
CREATE POLICY "Public reads active halls" ON public.function_halls
  FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admin manages halls" ON public.function_halls;
CREATE POLICY "Admin manages halls" ON public.function_halls
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE TABLE IF NOT EXISTS public.hall_bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id      UUID NOT NULL REFERENCES public.function_halls(id) ON DELETE CASCADE,
  customer_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  price        DECIMAL(10,2) NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hall_id, booking_date)
);

ALTER TABLE public.hall_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer reads own hall bookings" ON public.hall_bookings;
CREATE POLICY "Customer reads own hall bookings" ON public.hall_bookings
  FOR SELECT USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
DROP POLICY IF EXISTS "Customer creates hall booking" ON public.hall_bookings;
CREATE POLICY "Customer creates hall booking" ON public.hall_bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS "Admin updates hall bookings" ON public.hall_bookings;
CREATE POLICY "Admin updates hall bookings" ON public.hall_bookings
  FOR UPDATE USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Step 9: campaigns ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('push','whatsapp','email','in_app_banner','promotional_banner')),
  audience_segment JSONB NOT NULL DEFAULT '{"match":"all","rules":[]}'::jsonb,
  content          JSONB NOT NULL DEFAULT '{}'::jsonb,
  schedule_at      TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','failed')),
  created_by       UUID REFERENCES public.users(id),
  stats            JSONB NOT NULL DEFAULT '{"sent":0,"delivered":0,"opened":0,"clicked":0}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin manages campaigns" ON public.campaigns;
CREATE POLICY "Admin manages campaigns" ON public.campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Step 10: upsell_rules ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.upsell_rules (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     TEXT NOT NULL,
  trigger                  TEXT NOT NULL CHECK (trigger IN ('product_view','cart_contains','order_completed','category_view')),
  trigger_value            TEXT NOT NULL,
  recommended_product_ids  UUID[] NOT NULL DEFAULT '{}',
  priority                 INTEGER NOT NULL DEFAULT 0,
  is_active                BOOLEAN NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upsell_trigger ON public.upsell_rules(trigger, trigger_value) WHERE is_active = TRUE;

ALTER TABLE public.upsell_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads active upsell" ON public.upsell_rules;
CREATE POLICY "Public reads active upsell" ON public.upsell_rules
  FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admin manages upsell" ON public.upsell_rules;
CREATE POLICY "Admin manages upsell" ON public.upsell_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Step 11: notification_log (consolidated inbox) ───────────
CREATE TABLE IF NOT EXISTS public.notification_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  channel    TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('push','whatsapp','email','in_app')),
  type       TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('order','booking','promo','system','loyalty','review')),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  read_at    TIMESTAMPTZ,
  meta       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_log_user ON public.notification_log(user_id, created_at DESC);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User reads own notif log" ON public.notification_log;
CREATE POLICY "User reads own notif log" ON public.notification_log
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
DROP POLICY IF EXISTS "User updates own notif log" ON public.notification_log;
CREATE POLICY "User updates own notif log" ON public.notification_log
  FOR UPDATE USING (user_id = auth.uid());

-- ── Step 12: analytics_events ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id  TEXT,
  event_name  TEXT NOT NULL,
  props       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON public.analytics_events(event_name);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User inserts own analytics" ON public.analytics_events;
CREATE POLICY "User inserts own analytics" ON public.analytics_events
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
DROP POLICY IF EXISTS "Admin reads analytics" ON public.analytics_events;
CREATE POLICY "Admin reads analytics" ON public.analytics_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ════════════════════════════════════════════════════════════
-- RPCs
-- ════════════════════════════════════════════════════════════

-- get_available_providers: matching providers for a category + time
CREATE OR REPLACE FUNCTION public.get_available_providers(
  p_category_id UUID,
  p_scheduled_at TIMESTAMPTZ
)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  rating DECIMAL,
  total_jobs INTEGER,
  commission_pct DECIMAL
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_dow INTEGER;
  v_time TIME;
BEGIN
  v_dow := EXTRACT(DOW FROM p_scheduled_at);
  v_time := p_scheduled_at::time;

  RETURN QUERY
  SELECT p.id, p.business_name, p.rating, p.total_jobs, p.commission_pct
  FROM public.providers p
  WHERE p.kyc_status = 'approved'
    AND p.is_available = TRUE
    AND p_category_id = ANY(p.category_ids)
    AND EXISTS (
      SELECT 1 FROM public.provider_availability pa
      WHERE pa.provider_id = p.id
        AND pa.day_of_week = v_dow
        AND pa.is_active = TRUE
        AND pa.start_time <= v_time
        AND pa.end_time > v_time
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.service_bookings b
      WHERE b.provider_id = p.id
        AND b.status IN ('confirmed','en_route','in_progress')
        AND ABS(EXTRACT(EPOCH FROM (b.scheduled_at - p_scheduled_at))) < 3600
    )
  ORDER BY p.rating DESC, p.total_jobs DESC
  LIMIT 20;
END;
$$;

-- transition_booking_status: authoritative FSM
CREATE OR REPLACE FUNCTION public.transition_booking_status(
  p_booking_id UUID,
  p_to_status TEXT,
  p_actor_id UUID,
  p_note TEXT DEFAULT NULL
)
RETURNS public.service_bookings LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_from TEXT;
  v_row public.service_bookings;
  v_allowed BOOLEAN := FALSE;
BEGIN
  SELECT status INTO v_from FROM public.service_bookings WHERE id = p_booking_id;
  IF v_from IS NULL THEN
    RAISE EXCEPTION 'Booking % not found', p_booking_id;
  END IF;

  -- FSM transitions
  v_allowed := CASE
    WHEN v_from = 'pending' AND p_to_status IN ('confirmed','rejected','cancelled') THEN TRUE
    WHEN v_from = 'confirmed' AND p_to_status IN ('en_route','cancelled') THEN TRUE
    WHEN v_from = 'en_route' AND p_to_status IN ('in_progress','cancelled') THEN TRUE
    WHEN v_from = 'in_progress' AND p_to_status = 'completed' THEN TRUE
    WHEN v_from = 'completed' AND p_to_status = 'paid' THEN TRUE
    ELSE FALSE
  END;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Invalid transition % -> %', v_from, p_to_status;
  END IF;

  UPDATE public.service_bookings
  SET status = p_to_status,
      updated_at = NOW(),
      started_at = CASE WHEN p_to_status = 'in_progress' THEN NOW() ELSE started_at END,
      completed_at = CASE WHEN p_to_status = 'completed' THEN NOW() ELSE completed_at END,
      cancel_reason = CASE WHEN p_to_status IN ('cancelled','rejected') THEN p_note ELSE cancel_reason END,
      cancelled_by = CASE WHEN p_to_status IN ('cancelled','rejected') THEN p_actor_id ELSE cancelled_by END
  WHERE id = p_booking_id
  RETURNING * INTO v_row;

  INSERT INTO public.service_booking_events (booking_id, from_status, to_status, actor_id, note)
  VALUES (p_booking_id, v_from, p_to_status, p_actor_id, p_note);

  RETURN v_row;
END;
$$;

-- revenue_by_stream: products vs services vs commission over a date range
CREATE OR REPLACE FUNCTION public.revenue_by_stream(
  p_start DATE,
  p_end DATE
)
RETURNS TABLE (
  period TEXT,
  products DECIMAL,
  services DECIMAL,
  commission DECIMAL
) LANGUAGE sql SECURITY DEFINER AS $$
  WITH days AS (
    SELECT generate_series(p_start, p_end, '1 day'::interval)::date AS d
  ),
  prod AS (
    SELECT date_trunc('day', created_at)::date AS d,
           SUM(grand_total) AS total,
           SUM(grand_total * 0.08) AS comm
    FROM public.orders
    WHERE status = 'delivered'
      AND created_at::date BETWEEN p_start AND p_end
    GROUP BY 1
  ),
  svc AS (
    SELECT date_trunc('day', created_at)::date AS d,
           SUM(price) AS total,
           SUM(commission) AS comm
    FROM public.service_bookings
    WHERE status IN ('completed','paid')
      AND created_at::date BETWEEN p_start AND p_end
    GROUP BY 1
  )
  SELECT
    to_char(days.d, 'DD Mon') AS period,
    COALESCE(prod.total, 0) AS products,
    COALESCE(svc.total, 0) AS services,
    COALESCE(prod.comm, 0) + COALESCE(svc.comm, 0) AS commission
  FROM days
  LEFT JOIN prod ON prod.d = days.d
  LEFT JOIN svc ON svc.d = days.d
  ORDER BY days.d;
$$;

-- compute_cohort_retention: monthly cohorts x month offset retention %
CREATE OR REPLACE FUNCTION public.compute_cohort_retention(
  p_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  cohort_month TEXT,
  cohort_size INTEGER,
  retention JSONB
) LANGUAGE sql SECURITY DEFINER AS $$
  WITH signup AS (
    SELECT id AS user_id, date_trunc('month', created_at) AS cohort_m
    FROM public.users
    WHERE role = 'customer'
      AND created_at >= date_trunc('month', NOW()) - (p_months || ' months')::interval
  ),
  activity AS (
    SELECT customer_id AS user_id, date_trunc('month', created_at) AS active_m
    FROM public.orders
    WHERE status = 'delivered'
    GROUP BY 1, 2
  ),
  joined AS (
    SELECT
      s.cohort_m,
      (EXTRACT(YEAR FROM a.active_m) * 12 + EXTRACT(MONTH FROM a.active_m))::int
      - (EXTRACT(YEAR FROM s.cohort_m) * 12 + EXTRACT(MONTH FROM s.cohort_m))::int AS offset_m,
      COUNT(DISTINCT s.user_id) AS active_users
    FROM signup s
    LEFT JOIN activity a ON a.user_id = s.user_id AND a.active_m >= s.cohort_m
    GROUP BY 1, 2
  ),
  sizes AS (
    SELECT cohort_m, COUNT(*) AS size FROM signup GROUP BY cohort_m
  )
  SELECT
    to_char(sizes.cohort_m, 'YYYY-MM') AS cohort_month,
    sizes.size::int AS cohort_size,
    COALESCE(
      jsonb_agg(
        CASE WHEN sizes.size > 0 THEN ROUND(100.0 * j.active_users / sizes.size, 1) ELSE 0 END
        ORDER BY j.offset_m
      ) FILTER (WHERE j.offset_m IS NOT NULL AND j.offset_m >= 0),
      '[]'::jsonb
    ) AS retention
  FROM sizes
  LEFT JOIN joined j ON j.cohort_m = sizes.cohort_m
  GROUP BY sizes.cohort_m, sizes.size
  ORDER BY sizes.cohort_m;
$$;

-- compute_rfm_segments
CREATE OR REPLACE FUNCTION public.compute_rfm_segments(
  p_start DATE DEFAULT (NOW() - INTERVAL '180 days')::date,
  p_end DATE DEFAULT NOW()::date
)
RETURNS TABLE (
  user_id UUID,
  recency INTEGER,
  frequency INTEGER,
  monetary INTEGER,
  label TEXT
) LANGUAGE sql SECURITY DEFINER AS $$
  WITH base AS (
    SELECT
      o.customer_id,
      EXTRACT(DAY FROM NOW() - MAX(o.created_at))::int AS recency_days,
      COUNT(*)::int AS freq,
      SUM(o.grand_total)::int AS mon
    FROM public.orders o
    WHERE o.status = 'delivered'
      AND o.created_at::date BETWEEN p_start AND p_end
    GROUP BY o.customer_id
  ),
  scored AS (
    SELECT
      customer_id,
      NTILE(5) OVER (ORDER BY recency_days DESC) AS r,
      NTILE(5) OVER (ORDER BY freq ASC)          AS f,
      NTILE(5) OVER (ORDER BY mon ASC)           AS m
    FROM base
  )
  SELECT
    customer_id AS user_id,
    r::int AS recency,
    f::int AS frequency,
    m::int AS monetary,
    CASE
      WHEN r >= 4 AND f >= 4 AND m >= 4 THEN 'Champions'
      WHEN r >= 3 AND f >= 3 THEN 'Loyal'
      WHEN r >= 4 AND f <= 2 THEN 'New'
      WHEN r <= 2 AND f >= 3 THEN 'At Risk'
      WHEN r <= 2 AND f <= 2 THEN 'Lost'
      ELSE 'Needs Attention'
    END AS label
  FROM scored;
$$;

-- compute_hourly_heatmap: order volume by (dow, hour)
CREATE OR REPLACE FUNCTION public.compute_hourly_heatmap(
  p_start DATE DEFAULT (NOW() - INTERVAL '30 days')::date,
  p_end DATE DEFAULT NOW()::date
)
RETURNS TABLE (
  day_of_week INTEGER,
  hour INTEGER,
  count INTEGER
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    EXTRACT(DOW FROM created_at)::int AS day_of_week,
    EXTRACT(HOUR FROM created_at)::int AS hour,
    COUNT(*)::int AS count
  FROM public.orders
  WHERE created_at::date BETWEEN p_start AND p_end
  GROUP BY 1, 2
  ORDER BY 1, 2;
$$;

-- ════════════════════════════════════════════════════════════
-- SEED DATA
-- ════════════════════════════════════════════════════════════

INSERT INTO public.service_categories (slug, name_en, name_te, emoji, base_price, sort_order, description_en)
VALUES
  ('electrician',           'Electrician',           'ఎలక్ట్రీషియన్',    '⚡',  199, 1,  'Wiring, switches, fan/light installation'),
  ('plumber',               'Plumber',               'ప్లంబర్',           '🔧', 199, 2,  'Leaks, taps, drains, bathroom fittings'),
  ('carpenter',             'Carpenter',             'వడ్రంగి',           '🪚', 249, 3,  'Furniture repair, door/window, modular work'),
  ('ac_mechanic',           'AC Mechanic',           'ఏసీ మెకానిక్',     '❄️',  399, 4,  'AC service, gas refill, repair'),
  ('refrigerator_mechanic', 'Refrigerator Mechanic', 'ఫ్రిజ్ మెకానిక్',  '🧊', 299, 5,  'Fridge repair and maintenance'),
  ('car_mechanic',          'Car Mechanic',          'కార్ మెకానిక్',    '🚗', 499, 6,  'Doorstep car service'),
  ('bike_mechanic',         'Bike Mechanic',         'బైక్ మెకానిక్',    '🏍️',  199, 7,  'Doorstep bike service'),
  ('house_cleaning',        'House Cleaning',        'ఇల్లు క్లీనింగ్',  '🧹', 299, 8,  'Deep clean, regular clean'),
  ('packers_movers',        'Packers & Movers',      'ప్యాకర్లు',         '📦', 1999, 9, 'Home and office shifting'),
  ('function_hall',         'Function Halls',        'ఫంక్షన్ హాల్',     '🎉', 0,   10, 'Book wedding and party halls'),
  ('painter',               'Painter',               'పెయింటర్',          '🎨', 499, 11, 'Interior and exterior painting'),
  ('pest_control',          'Pest Control',          'పెస్ట్ కంట్రోల్',  '🐛', 599, 12, 'Cockroach, termite, rodent'),
  ('cctv_installation',     'CCTV Installation',     'సీసీటీవీ',         '📹', 999, 13, 'Setup & maintenance'),
  ('inverter_ups',          'Inverter / UPS',        'ఇన్వర్టర్',         '🔋', 399, 14, 'Battery, inverter service')
ON CONFLICT (slug) DO NOTHING;

-- Starter packages (2 per category) — price = category base, 60 mins flat
INSERT INTO public.service_packages (category_id, name_en, name_te, pricing_model, price, duration_mins, inclusions)
SELECT c.id,
       'Basic Visit — ' || c.name_en,
       'సాధారణ సందర్శన',
       'flat',
       c.base_price,
       60,
       '["Inspection","Up to 1 hour labour","Basic tools"]'::jsonb
FROM public.service_categories c
WHERE c.slug <> 'function_hall'
ON CONFLICT DO NOTHING;

INSERT INTO public.service_packages (category_id, name_en, name_te, pricing_model, price, duration_mins, inclusions)
SELECT c.id,
       'Standard Service — ' || c.name_en,
       'ప్రామాణిక సేవ',
       'flat',
       c.base_price * 2,
       120,
       '["Full inspection","Up to 2 hours labour","Minor parts included"]'::jsonb
FROM public.service_categories c
WHERE c.slug <> 'function_hall'
ON CONFLICT DO NOTHING;

-- Enable realtime for provider-facing tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_booking_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_log;
