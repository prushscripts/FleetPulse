import { buildPlateMap, buildTerritoryMap } from '@/lib/dashboard-maps'
import DashboardClient from '@/app/(dashboard)/dashboard/DashboardClient'
import TabSlideTransition from '@/components/animations/TabSlideTransition'
import DashboardErrorBoundary from '@/app/(dashboard)/dashboard/DashboardErrorBoundary'

/** Temporary public preview: vehicles tab without login. */
export default function PreviewVehiclesPage() {
  const plateMap = buildPlateMap()
  const territoryMap = buildTerritoryMap()

  return (
    <DashboardErrorBoundary>
      <TabSlideTransition>
        <DashboardClient plateMap={plateMap} territoryMap={territoryMap} companyId={undefined} />
      </TabSlideTransition>
    </DashboardErrorBoundary>
  )
}
