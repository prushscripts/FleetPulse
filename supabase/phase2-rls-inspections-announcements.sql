-- Phase 2: RLS for inspection_templates, inspections, and announcements
-- Run after phase2-inspections-announcements.sql. Ensures profiles has company_id for policy.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- inspection_templates: company-scoped
ALTER TABLE inspection_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inspection_templates_select" ON inspection_templates;
CREATE POLICY "inspection_templates_select" ON inspection_templates
  FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "inspection_templates_insert" ON inspection_templates;
CREATE POLICY "inspection_templates_insert" ON inspection_templates
  FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "inspection_templates_update" ON inspection_templates;
CREATE POLICY "inspection_templates_update" ON inspection_templates
  FOR UPDATE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "inspection_templates_delete" ON inspection_templates;
CREATE POLICY "inspection_templates_delete" ON inspection_templates
  FOR DELETE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- inspections: company-scoped; allow drivers to insert/select their own
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inspections_select" ON inspections;
CREATE POLICY "inspections_select" ON inspections
  FOR SELECT USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR submitted_by_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "inspections_insert" ON inspections;
CREATE POLICY "inspections_insert" ON inspections
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR submitted_by_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "inspections_update" ON inspections;
CREATE POLICY "inspections_update" ON inspections
  FOR UPDATE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "inspections_delete" ON inspections;
CREATE POLICY "inspections_delete" ON inspections
  FOR DELETE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));


-- Ensure announcements has company_id (in case table existed without it)
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- announcements: company-scoped
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_select" ON announcements;
CREATE POLICY "announcements_select" ON announcements
  FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "announcements_insert" ON announcements;
CREATE POLICY "announcements_insert" ON announcements
  FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "announcements_update" ON announcements;
CREATE POLICY "announcements_update" ON announcements
  FOR UPDATE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "announcements_delete" ON announcements;
CREATE POLICY "announcements_delete" ON announcements
  FOR DELETE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
