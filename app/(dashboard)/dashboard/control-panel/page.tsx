import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ControlPanelClient from './ControlPanelClient'
import TabSlideTransition from '@/components/animations/TabSlideTransition'

export default async function ControlPanelPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const companyId = user.user_metadata?.company_id as string | undefined
  const companySettings = (user.user_metadata?.company_settings as Record<string, { template?: string; inspectionsEnabled?: boolean; territorySegments?: string[] }>) || {}
  const settings = companyId ? companySettings[companyId] : undefined

  let trialEndsAt: string | null = null
  let companyConfig: { auth_key?: string; enabled_tabs?: string[]; custom_tab_labels?: Record<string, string>; inspections_enabled?: boolean; roadmap_only?: boolean } | null = null
  if (companyId) {
    const { data: company } = await supabase.from('companies').select('trial_ends_at, auth_key, enabled_tabs, custom_tab_labels, inspections_enabled, roadmap_only').eq('id', companyId).maybeSingle()
    trialEndsAt = company?.trial_ends_at ?? null
    companyConfig = company ? { auth_key: company.auth_key, enabled_tabs: company.enabled_tabs ?? undefined, custom_tab_labels: (company.custom_tab_labels as Record<string, string>) ?? undefined, inspections_enabled: company.inspections_enabled, roadmap_only: company.roadmap_only } : null
  }

  return (
    <>
      <TabSlideTransition>
        <ControlPanelClient
          companyId={companyId}
          initialTemplate={settings?.template ?? 'default'}
          initialInspectionsEnabled={settings?.inspectionsEnabled ?? companyConfig?.inspections_enabled ?? true}
          initialTerritorySegments={settings?.territorySegments ?? []}
          trialEndsAt={trialEndsAt}
          initialCompanyConfig={companyConfig}
        />
      </TabSlideTransition>
    </>
  )
}
