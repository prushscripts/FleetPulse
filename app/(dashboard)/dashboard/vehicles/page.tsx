import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Vehicles — FleetPulse' }
import { redirect } from 'next/navigation'
import { buildPlateMap, buildTerritoryMap } from '@/lib/dashboard-maps'
import DashboardClient from '../DashboardClient'
import TabSlideTransition from '@/components/animations/TabSlideTransition'
import DashboardErrorBoundary from '../DashboardErrorBoundary'

/** Fleet list at /dashboard/vehicles (same view as /dashboard) so nav tabs stay distinct. */
export default async function VehiclesPage() {
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
