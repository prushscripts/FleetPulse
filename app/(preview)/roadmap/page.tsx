import TabSlideTransition from '@/components/animations/TabSlideTransition'
import RoadmapClient from '@/app/(dashboard)/dashboard/roadmap/RoadmapClient'

/** Temporary public preview: roadmap tab without login. */
export default function PreviewRoadmapPage() {
  return (
    <TabSlideTransition>
      <RoadmapClient />
    </TabSlideTransition>
  )
}
