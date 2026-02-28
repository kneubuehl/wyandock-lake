-- Up North — Database Migration
-- Run this against your Supabase project SQL editor

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow insert for auth trigger" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PARENT SCHEDULE
-- ============================================
CREATE TABLE IF NOT EXISTS public.parent_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE,
  first_parent TEXT NOT NULL CHECK (first_parent IN ('cheryl', 'stephen_sr')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.parent_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schedule viewable by authenticated" ON public.parent_schedule
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Schedule editable by admins" ON public.parent_schedule
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- RESERVATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reservations viewable by authenticated" ON public.reservations
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert reservations" ON public.reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reservations" ON public.reservations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reservations" ON public.reservations
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- PROCEDURES
-- ============================================
CREATE TABLE IF NOT EXISTS public.procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Procedures viewable by authenticated" ON public.procedures
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Procedures insertable by authenticated" ON public.procedures
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Procedures updatable by authenticated" ON public.procedures
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Procedures deletable by authenticated" ON public.procedures
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- MAINTENANCE TASKS
-- ============================================
CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  recurrence TEXT NOT NULL DEFAULT 'one-time' CHECK (recurrence IN ('one-time', 'monthly', 'quarterly', 'annual', 'custom')),
  recurrence_details JSONB,
  next_due_date DATE,
  assigned_to UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks viewable by authenticated" ON public.maintenance_tasks
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Tasks insertable by authenticated" ON public.maintenance_tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Tasks updatable by authenticated" ON public.maintenance_tasks
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Tasks deletable by authenticated" ON public.maintenance_tasks
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- MAINTENANCE LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.maintenance_tasks(id) ON DELETE CASCADE,
  completed_by UUID NOT NULL REFERENCES public.profiles(id),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logs viewable by authenticated" ON public.maintenance_logs
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Logs insertable by authenticated" ON public.maintenance_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- HANDOFF NOTES
-- ============================================
CREATE TABLE IF NOT EXISTS public.handoff_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.handoff_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notes viewable by authenticated" ON public.handoff_notes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Notes insertable by authenticated" ON public.handoff_notes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Notes updatable by authenticated" ON public.handoff_notes
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Notes deletable by authenticated" ON public.handoff_notes
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- SECURITY CODES
-- ============================================
CREATE TABLE IF NOT EXISTS public.security_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  code TEXT NOT NULL,
  notes TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.security_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Codes viewable by authenticated" ON public.security_codes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Codes insertable by authenticated" ON public.security_codes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Codes updatable by authenticated" ON public.security_codes
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Codes deletable by authenticated" ON public.security_codes
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- VENDOR CONTACTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.vendor_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contacts viewable by authenticated" ON public.vendor_contacts
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Contacts insertable by authenticated" ON public.vendor_contacts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Contacts updatable by authenticated" ON public.vendor_contacts
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Contacts deletable by authenticated" ON public.vendor_contacts
  FOR DELETE USING (auth.role() = 'authenticated');
