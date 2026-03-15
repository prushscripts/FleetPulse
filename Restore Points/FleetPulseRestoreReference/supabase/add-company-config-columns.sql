-- Company configuration: single source of truth for tabs, labels, inspections, roadmap.
-- Run in Supabase SQL Editor.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS enabled_tabs TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS custom_tab_labels JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS inspections_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS roadmap_only BOOLEAN DEFAULT false;

COMMENT ON COLUMN companies.enabled_tabs IS 'Tab keys to show in navbar: home, vehicles, drivers, inspections, about, roadmap, control_panel. Order preserved.';
COMMENT ON COLUMN companies.custom_tab_labels IS 'Override labels per tab key, e.g. {"vehicles": "Trucks", "drivers": "Team"}.';
COMMENT ON COLUMN companies.inspections_enabled IS 'When false, Inspections tab is hidden.';
COMMENT ON COLUMN companies.roadmap_only IS 'When true, company only sees Roadmap (e.g. invite-only roadmap access).';
