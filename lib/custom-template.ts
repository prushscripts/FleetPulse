/**
 * Custom dashboard template: sections, layout, and nav tabs.
 * Stored in user_metadata.company_settings[companyId].customTemplate
 */

export type SectionType =
  | 'key_metrics'
  | 'oil_status'
  | 'inspection_status'
  | 'vehicle_status_breakdown'
  | 'quick_actions'
  | 'alerts'
  | 'custom_text'
  | 'territory_tabs'

export interface CustomSection {
  id: string
  type: SectionType
  order: number
  config?: {
    title?: string
    body?: string
    columns?: 2 | 3 | 4
  }
}

export type LayoutColumns = 2 | 3 | 4
export type LayoutSpacing = 'compact' | 'default' | 'spacious'

export interface CustomTemplate {
  /** Ordered section ids and types */
  sections: CustomSection[]
  /** Grid columns for metric-style sections */
  columns: LayoutColumns
  spacing: LayoutSpacing
  /** Nav tab keys to show, in order. Omit or empty = use default set */
  tabs?: string[]
  /** Optional home dashboard title override */
  headerTitle?: string
  /** Optional home dashboard subtitle override */
  headerSubtitle?: string
}

export const SECTION_DEFINITIONS: Record<
  SectionType,
  { label: string; description: string; icon: string }
> = {
  key_metrics: {
    label: 'Key metrics',
    description: 'Total vehicles, active, open issues, expired documents',
    icon: '📊',
  },
  territory_tabs: {
    label: 'Territory / segment tabs',
    description: 'Full fleet and custom region filters',
    icon: '🗺️',
  },
  oil_status: {
    label: 'Oil change status',
    description: 'Progress bar and OK / due soon / overdue counts',
    icon: '🛢️',
  },
  inspection_status: {
    label: 'Inspection status',
    description: 'Pass rate and passed / pending / failed counts',
    icon: '✅',
  },
  vehicle_status_breakdown: {
    label: 'Vehicle status breakdown',
    description: 'Active, out of service, in shop and related metrics',
    icon: '🚛',
  },
  quick_actions: {
    label: 'Quick actions',
    description: 'Links to vehicles, drivers, inspections, add vehicle',
    icon: '⚡',
  },
  alerts: {
    label: 'Alerts / open issues',
    description: 'List of open issues and critical items',
    icon: '🔔',
  },
  custom_text: {
    label: 'Custom message',
    description: 'Your own title and body text (e.g. welcome or policy)',
    icon: '📝',
  },
}

export const DEFAULT_NAV_TAB_KEYS = [
  'home',
  'vehicles',
  'drivers',
  'inspections',
  'about',
  'roadmap',
  'control_panel',
] as const

export const NAV_TAB_OPTIONS: { key: string; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'drivers', label: 'Drivers' },
  { key: 'inspections', label: 'Inspections' },
  { key: 'about', label: 'About' },
  { key: 'roadmap', label: 'Roadmap' },
  { key: 'control_panel', label: 'Control Panel' },
]

export function createDefaultCustomTemplate(): CustomTemplate {
  return {
    sections: [
      { id: 's1', type: 'territory_tabs', order: 0 },
      { id: 's2', type: 'key_metrics', order: 1 },
      { id: 's3', type: 'oil_status', order: 2 },
      { id: 's4', type: 'inspection_status', order: 3 },
      { id: 's5', type: 'vehicle_status_breakdown', order: 4 },
      { id: 's6', type: 'quick_actions', order: 5 },
    ],
    columns: 4,
    spacing: 'default',
    tabs: [...DEFAULT_NAV_TAB_KEYS],
    headerTitle: 'Fleet Health Dashboard',
    headerSubtitle: 'Overview of operational health, inspections, and risk indicators',
  }
}

export function nextSectionId(existing: CustomSection[]): string {
  const used = new Set(existing.map((s) => s.id))
  let n = existing.length + 1
  while (used.has(`s${n}`)) n++
  return `s${n}`
}
