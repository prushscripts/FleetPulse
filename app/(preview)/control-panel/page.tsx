import TabSlideTransition from '@/components/animations/TabSlideTransition'
import ControlPanelClient from '@/app/(dashboard)/dashboard/control-panel/ControlPanelClient'
import { getPreviewControlPanelData } from '@/lib/preview-control-panel-data'

/** Temporary public preview: control panel tab with Wheelz Up config (view-only; saves require login). */
export default async function PreviewControlPanelPage() {
  let data: Awaited<ReturnType<typeof getPreviewControlPanelData>>
  try {
    data = await getPreviewControlPanelData()
  } catch (_e) {
    data = {
      companyId: 'a0000000-0000-0000-0000-000000000001',
      trialEndsAt: null,
      initialTemplate: 'default',
      initialInspectionsEnabled: true,
      initialTerritorySegments: [],
      initialCompanyConfig: null,
    }
  }

  return (
    <TabSlideTransition>
      <ControlPanelClient
        companyId={data.companyId}
        initialTemplate={data.initialTemplate}
        initialInspectionsEnabled={data.initialInspectionsEnabled}
        initialTerritorySegments={data.initialTerritorySegments}
        trialEndsAt={data.trialEndsAt}
        initialCompanyConfig={data.initialCompanyConfig}
      />
    </TabSlideTransition>
  )
}
