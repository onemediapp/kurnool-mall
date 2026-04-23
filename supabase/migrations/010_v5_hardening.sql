-- ═══════════════════════════════════════════════════════
-- MIGRATION 010 — V5 Production Hardening
-- ═══════════════════════════════════════════════════════
-- Adds: webhook_logs, edge_rate_limits, RLS hardening
-- to prevent vendor self-approval, commission self-edit,
-- and user role self-escalation.
-- ═══════════════════════════════════════════════════════

-- ─── 1. Webhook idempotency log (Razorpay etc.) ────────
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  processed       BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_source_event
  ON public.webhook_logs(source, event_type, created_at DESC);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhook_admin_only" ON public.webhook_logs;
CREATE POLICY "webhook_admin_only" ON public.webhook_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 2. Per-user Edge Function rate limiting ───────────
CREATE TABLE IF NOT EXISTS public.edge_rate_limits (
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL,
  count         INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, function_name, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window
  ON public.edge_rate_limits(window_start);

ALTER TABLE public.edge_rate_limits ENABLE ROW LEVEL SECURITY;

-- No client policies — service_role only via Edge Functions.

-- ─── 3. RLS hardening — vendors ────────────────────────
-- Replace permissive vendors_own_update with a WITH CHECK
-- that prevents self-approval (kyc_status) and self
-- commission_rate edits.
DROP POLICY IF EXISTS "vendors_own_update" ON public.vendors;

CREATE POLICY "vendors_update_own" ON public.vendors
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND kyc_status      = (SELECT v.kyc_status      FROM public.vendors v WHERE v.user_id = auth.uid())
    AND commission_rate = (SELECT v.commission_rate FROM public.vendors v WHERE v.user_id = auth.uid())
    AND is_active       = (SELECT v.is_active       FROM public.vendors v WHERE v.user_id = auth.uid())
  );

-- ─── 4. RLS hardening — users (no role escalation) ─────
DROP POLICY IF EXISTS "users_update_own" ON public.users;

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT u.role FROM public.users u WHERE u.id = auth.uid())
  );
