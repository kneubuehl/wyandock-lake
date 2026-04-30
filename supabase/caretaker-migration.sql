-- ============================================
-- Add 'caretaker' role support
-- Run in Supabase SQL editor.
-- ============================================

-- 1. Extend role CHECK constraint to allow 'caretaker'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'member', 'caretaker'));

-- 2. Update handle_new_user to assign caretaker role to known caretaker emails.
--    Extend CARETAKER_EMAILS list below as more caretakers are onboarded.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  caretaker_emails TEXT[] := ARRAY['nathan@jackofalltradeswisconsin.com'];
  admin_emails TEXT[] := ARRAY[
    'kneubuehl@live.com',
    'cherylk50@msn.com',
    's.kneubuehl@aol.com'
  ];
  resolved_role TEXT;
  resolved_display TEXT;
BEGIN
  IF NEW.email = ANY(caretaker_emails) THEN
    resolved_role := 'caretaker';
  ELSIF NEW.email = ANY(admin_emails) THEN
    resolved_role := 'admin';
  ELSE
    resolved_role := COALESCE(NEW.raw_user_meta_data->>'role', 'member');
  END IF;

  -- Default display name for Nathan specifically; others fall back to email prefix
  IF NEW.email = 'nathan@jackofalltradeswisconsin.com' THEN
    resolved_display := 'Nathan';
  ELSE
    resolved_display := COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    );
  END IF;

  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (NEW.id, NEW.email, resolved_display, resolved_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
