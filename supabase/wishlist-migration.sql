-- Wish List table
CREATE TABLE IF NOT EXISTS public.wish_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'archived')),
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wish_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wish list viewable by authenticated" ON public.wish_list
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Wish list insertable by authenticated" ON public.wish_list
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Wish list updatable by authenticated" ON public.wish_list
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Wish list deletable by authenticated" ON public.wish_list
  FOR DELETE USING (auth.role() = 'authenticated');
