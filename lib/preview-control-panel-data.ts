import { createAdminClient } from '@/lib/supabase/admin'
import { PREVIEW_COMPANY_ID } from '@/lib/preview-company'

export type PreviewControlPanelData = {
  companyId: string
  trialEndsAt: string | null
  initialTemplate: string
  initialInspectionsEnabled: boolean
  initialTerritorySegments: string[]
  initialCompanyConfig: {
    auth_key?: string
    enabled_tabs?: string[]
    custom_tab_labels?: Record<string, string>
    inspections_enabled?: boolean
  } | null
}

export async function getPreviewControlPanelData(): Promise<PreviewControlPanelData> {
  const supabase = createAdminClient()
  const { data: company } = await supabase
    .from('companies')
    .select('trial_ends_at, auth_key, enabled_tabs, custom_tab_labels, inspections_enabled')
    .eq('id', PREVIEW_COMPANY_ID)
    .maybeSingle()

  return {
    companyId: PREVIEW_COMPANY_ID,
    trialEndsAt: company?.trial_ends_at ?? null,
    initialTemplate: 'default',
    initialInspectionsEnabled: company?.inspections_enabled ?? true,
    initialTerritorySegments: [],
        initialCompanyConfig: company
      ? {
          auth_key: company.auth_key ?? undefined,
          enabled_tabs: (company.enabled_tabs as string[] | undefined) ?? undefined,
          custom_tab_labels: (company.custom_tab_labels as Record<string, string> | undefined) ?? undefined,
          inspections_enabled: company.inspections_enabled ?? undefined,
        }
      : null,
  }
}
