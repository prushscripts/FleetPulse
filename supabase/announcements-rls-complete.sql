-- Run this ONCE: add company_id to announcements then create RLS policies.
-- Use this if running "RLS inspections announcements" alone keeps failing.

-- 1. Add column (no-op if already exists)
ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- 2. Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "announcements_select" ON public.announcements;
CREATE POLICY "announcements_select" ON public.announcements
  FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "announcements_insert" ON public.announcements;
CREATE POLICY "announcements_insert" ON public.announcements
  FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "announcements_update" ON public.announcements;
CREATE POLICY "announcements_update" ON public.announcements
  FOR UPDATE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "announcements_delete" ON public.announcements;
CREATE POLICY "announcements_delete" ON public.announcements
  FOR DELETE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
