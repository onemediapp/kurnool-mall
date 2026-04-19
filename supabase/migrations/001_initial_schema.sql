-- ============================================================
-- KURNOOL MALL — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ─── ENUMS ────────────────────────────────────────────────

CREATE TYPE user_role     AS ENUM ('customer', 'vendor', 'admin');
CREATE TYPE order_status  AS ENUM (
  'pending', 'accepted', 'rejected', 'preparing',
  'ready', 'out_for_delivery', 'delivered', 'cancelled'
);
CREATE TYPE payment_method AS ENUM ('upi', 'card', 'cod');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE kyc_status     AS ENUM ('pending', 'approved', 'rejected');

-- ─── TABLE: users ─────────────────────────────────────────

CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone         TEXT NOT NULL UNIQUE,
  name          TEXT,
  email         TEXT,
  role          user_role NOT NULL DEFAULT 'customer',
  language_pref TEXT NOT NULL DEFAULT 'en' CHECK (language_pref IN ('en','te')),
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_role  ON public.users(role);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "users_read_own"   ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
-- Admin reads all
CREATE POLICY "admin_read_users" ON public.users FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- ─── TABLE: addresses ─────────────────────────────────────

CREATE TABLE public.addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label        TEXT NOT NULL DEFAULT 'Home',
  address_line TEXT NOT NULL,
  city         TEXT NOT NULL DEFAULT 'Kurnool',
  pincode      TEXT NOT NULL,
  lat          DECIMAL(10,8),
  lng          DECIMAL(11,8),
  is_default   BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Users CRUD own addresses only
CREATE POLICY "addresses_crud_own" ON public.addresses FOR ALL USING (auth.uid() = user_id);

-- ─── TABLE: categories ────────────────────────────────────

CREATE TABLE public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en    TEXT NOT NULL,
  name_te    TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  icon_url   TEXT,
  parent_id  UUID REFERENCES public.categories(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public reads active categories
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (is_active = TRUE);
-- Admin manages all
CREATE POLICY "categories_admin_all" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- ─── TABLE: vendors ───────────────────────────────────────

CREATE TABLE public.vendors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  shop_name       TEXT NOT NULL,
  description     TEXT,
  category_ids    UUID[] NOT NULL DEFAULT '{}',
  logo_url        TEXT,
  gstin           TEXT,
  fssai_no        TEXT,
  kyc_status      kyc_status NOT NULL DEFAULT 'pending',
  rating          DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count    INTEGER NOT NULL DEFAULT 0,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  is_active       BOOLEAN NOT NULL DEFAULT FALSE,
  address_line    TEXT NOT NULL DEFAULT '',
  lat             DECIMAL(10,8),
  lng             DECIMAL(11,8),
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendors_user_id   ON public.vendors(user_id);
CREATE INDEX idx_vendors_is_active ON public.vendors(is_active);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Public reads active vendors
CREATE POLICY "vendors_public_read" ON public.vendors FOR SELECT USING (is_active = TRUE AND is_deleted = FALSE);
-- Vendor reads/updates own
CREATE POLICY "vendors_own_read"   ON public.vendors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vendors_own_update" ON public.vendors FOR UPDATE USING (auth.uid() = user_id);
-- Admin manages all
CREATE POLICY "vendors_admin_all" ON public.vendors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- ─── TABLE: products ──────────────────────────────────────

CREATE TABLE public.products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES public.categories(id),
  name_en         TEXT NOT NULL,
  name_te         TEXT NOT NULL,
  description_en  TEXT,
  description_te  TEXT,
  price_mrp       DECIMAL(10,2) NOT NULL CHECK (price_mrp >= 0),
  price_selling   DECIMAL(10,2) NOT NULL CHECK (price_selling >= 0),
  images          TEXT[] NOT NULL DEFAULT '{}',
  stock_qty       INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  unit            TEXT NOT NULL DEFAULT 'piece',
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  search_vector   TSVECTOR,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_vendor_id   ON public.products(vendor_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_is_available ON public.products(is_available) WHERE is_deleted = FALSE;
CREATE INDEX idx_products_search       ON public.products USING GIN(search_vector);
CREATE INDEX idx_products_name_trigram ON public.products USING GIN(name_en gin_trgm_ops);

-- Enable pg_trgm extension for trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public reads available products
CREATE POLICY "products_public_read" ON public.products FOR SELECT
  USING (is_available = TRUE AND is_deleted = FALSE);

-- Vendor CRUD own products
CREATE POLICY "products_vendor_crud" ON public.products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id AND v.user_id = auth.uid()
    )
  );

-- Admin manages all
CREATE POLICY "products_admin_all" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    SETWEIGHT(TO_TSVECTOR('english', COALESCE(NEW.name_en, '')), 'A') ||
    SETWEIGHT(TO_TSVECTOR('simple',  COALESCE(NEW.name_te, '')), 'A') ||
    SETWEIGHT(TO_TSVECTOR('english', COALESCE(NEW.description_en, '')), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_search_vector_update
  BEFORE INSERT OR UPDATE OF name_en, name_te, description_en
  ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- ─── TABLE: orders ────────────────────────────────────────

CREATE SEQUENCE order_number_seq START 1000;

CREATE TABLE public.orders (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number              TEXT NOT NULL UNIQUE DEFAULT (
                              'KM-' || TO_CHAR(NOW(),'YYYY') || '-' ||
                              LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0')
                            ),
  customer_id               UUID NOT NULL REFERENCES public.users(id),
  vendor_id                 UUID NOT NULL REFERENCES public.vendors(id),
  status                    order_status NOT NULL DEFAULT 'pending',
  subtotal                  DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee              DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount                  DECIMAL(10,2) NOT NULL DEFAULT 0,
  grand_total               DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method            payment_method NOT NULL,
  payment_status            payment_status NOT NULL DEFAULT 'pending',
  razorpay_order_id         TEXT,
  razorpay_payment_id       TEXT,
  delivery_address_id       UUID REFERENCES public.addresses(id),
  delivery_address_snapshot JSONB NOT NULL DEFAULT '{}',
  rider_id                  UUID REFERENCES public.users(id),
  rider_name                TEXT,
  rider_phone               TEXT,
  notes                     TEXT,
  rejection_reason          TEXT,
  is_deleted                BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_vendor_id   ON public.orders(vendor_id);
CREATE INDEX idx_orders_status      ON public.orders(status);
CREATE INDEX idx_orders_created_at  ON public.orders(created_at DESC);
CREATE INDEX idx_orders_payment     ON public.orders(payment_status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers read own orders
CREATE POLICY "orders_customer_read" ON public.orders FOR SELECT USING (auth.uid() = customer_id);
-- Vendors read their shop's orders
CREATE POLICY "orders_vendor_read" ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id AND v.user_id = auth.uid()
    )
  );
-- Admin reads all
CREATE POLICY "orders_admin_all" ON public.orders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
);
-- NOTE: Writes happen via Edge Functions using service_role key (bypasses RLS)

-- ─── TABLE: order_items ───────────────────────────────────

CREATE TABLE public.order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products(id),
  product_name  TEXT NOT NULL,
  product_image TEXT,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    DECIMAL(10,2) NOT NULL,
  total_price   DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_order_items_order_id   ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Same visibility as parent order
CREATE POLICY "order_items_customer_read" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.customer_id = auth.uid()
    )
  );
CREATE POLICY "order_items_vendor_read" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.vendors v ON v.id = o.vendor_id
      WHERE o.id = order_id AND v.user_id = auth.uid()
    )
  );
CREATE POLICY "order_items_admin_all" ON public.order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- ─── TRIGGER: auto-create public.users on auth signup ─────

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, phone, role)
  VALUES (NEW.id, COALESCE(NEW.phone, ''), 'customer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ─── TRIGGER: updated_at auto-update ──────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── REALTIME: Enable orders table ────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
