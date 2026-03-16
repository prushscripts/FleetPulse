import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { buildPlateMap, buildTerritoryMap } from '@/lib/dashboard-maps'
import DashboardClient from './DashboardClient'
import TabSlideTransition from '@/components/animations/TabSlideTransition'
import DashboardErrorBoundary from './DashboardErrorBoundary'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const companyId = user.user_metadata?.company_id as string | undefined
  const plateMap = buildPlateMap()
  const territoryMap = buildTerritoryMap()

  return (
    <DashboardErrorBoundary>
      <TabSlideTransition>
        <DashboardClient plateMap={plateMap} territoryMap={territoryMap} companyId={companyId} />
      </TabSlideTransition>
    </DashboardErrorBoundary>
  )
}
