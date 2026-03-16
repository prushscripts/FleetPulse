import TabSlideTransition from '@/components/animations/TabSlideTransition'
import DriversClient from '@/app/(dashboard)/dashboard/drivers/DriversClient'

/** Temporary public preview: drivers tab without login. */
export default function PreviewDriversPage() {
  return (
    <TabSlideTransition>
      <DriversClient companyId={undefined} />
    </TabSlideTransition>
  )
}
