-- ============================================
-- Reservation-created notification trigger
-- Fires pg_net.http_post to Next.js webhook whenever a
-- row is inserted into public.reservations. The webhook
-- sends an email to all caretaker profiles.
-- ============================================

-- 1. Ensure pg_net extension is available (Supabase standard).
-- pg_net creates its own `net` schema for the http_* functions.
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Store webhook config. Using a small settings table lets us
--    rotate the secret without redeploying SQL.
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Populate / upsert config values.
-- ⚠️ Replace the webhook_secret below if you rotate it.
INSERT INTO public.app_config (key, value) VALUES
  ('notify_webhook_url', 'https://lake.wyandock.com/api/hooks/reservation-created'),
  ('notify_webhook_secret', '28e4420584af488eb1fe0dc0a272467d0b03777a398bb4f2a7ca5bb014941cfe')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- 3. Trigger function
CREATE OR REPLACE FUNCTION public.notify_reservation_created()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  webhook_secret TEXT;
BEGIN
  SELECT value INTO webhook_url FROM public.app_config WHERE key = 'notify_webhook_url';
  SELECT value INTO webhook_secret FROM public.app_config WHERE key = 'notify_webhook_secret';

  IF webhook_url IS NULL OR webhook_secret IS NULL THEN
    -- Config missing; don't block the insert, just skip the notification.
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    ),
    body := jsonb_build_object('reservation_id', NEW.id)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block a reservation insert because of a notification failure.
  RAISE WARNING 'notify_reservation_created failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach trigger
DROP TRIGGER IF EXISTS reservation_created_notify ON public.reservations;
CREATE TRIGGER reservation_created_notify
  AFTER INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.notify_reservation_created();

-- 5. Lock down app_config (service role only; no public access)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
-- No policies = no access for anon/authenticated. Service role bypasses RLS.
