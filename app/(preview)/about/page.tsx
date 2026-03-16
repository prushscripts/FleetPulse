import TabSlideTransition from '@/components/animations/TabSlideTransition'
import AboutClient from '@/app/(dashboard)/dashboard/about/AboutClient'

/** Temporary public preview: about tab without login. */
export default function PreviewAboutPage() {
  return (
    <TabSlideTransition>
      <AboutClient displayName="Guest" />
    </TabSlideTransition>
  )
}
