import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ControlPanelClient from './ControlPanelClient'
import TabSlideTransition from '@/components/TabSlideTransition'

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
  if (companyId) {
    const { data: company } = await supabase.from('companies').select('trial_ends_at').eq('id', companyId).maybeSingle()
    trialEndsAt = company?.trial_ends_at ?? null
  }

  return (
    <>
      <Navbar />
      <TabSlideTransition>
        <ControlPanelClient
          companyId={companyId}
          initialTemplate={settings?.template ?? 'default'}
          initialInspectionsEnabled={settings?.inspectionsEnabled !== false}
          initialTerritorySegments={settings?.territorySegments ?? []}
          trialEndsAt={trialEndsAt}
        />
      </TabSlideTransition>
    </>
  )
}
