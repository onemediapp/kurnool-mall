-- Device tokens for Expo Push. One row per (user, token). Rows auto-delete
-- when a user is deleted.
CREATE TABLE IF NOT EXISTS public.user_devices (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  platform   TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  app        TEXT NOT NULL CHECK (app IN ('customer', 'vendor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, push_token)
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices (user_id);

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Users can read/write only their own device rows. Edge Functions use the
-- service role key and bypass RLS — that's where pushes are sent from.
DROP POLICY IF EXISTS "Users manage own devices" ON public.user_devices;
CREATE POLICY "Users manage own devices"
  ON public.user_devices FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
