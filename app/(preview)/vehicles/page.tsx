import { buildPlateMap, buildTerritoryMap } from '@/lib/dashboard-maps'
import { getPreviewFleetData } from '@/lib/preview-fleet-data'
import DashboardClient from '@/app/(dashboard)/dashboard/DashboardClient'
import TabSlideTransition from '@/components/animations/TabSlideTransition'
import DashboardErrorBoundary from '@/app/(dashboard)/dashboard/DashboardErrorBoundary'

/** Temporary public preview: vehicles tab with Wheelz Up company data (no login). */
export default async function PreviewVehiclesPage() {
  const plateMap = buildPlateMap()
  const territoryMap = buildTerritoryMap()

  let initialVehicles: Awaited<ReturnType<typeof getPreviewFleetData>> | undefined
  try {
    initialVehicles = await getPreviewFleetData()
  } catch (_e) {
    initialVehicles = undefined
  }

  return (
    <DashboardErrorBoundary>
      <TabSlideTransition>
        <DashboardClient
          plateMap={plateMap}
          territoryMap={territoryMap}
          companyId={undefined}
          initialVehicles={initialVehicles}
        />
      </TabSlideTransition>
    </DashboardErrorBoundary>
  )
}
