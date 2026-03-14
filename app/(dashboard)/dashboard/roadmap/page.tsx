import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RoadmapClient from './RoadmapClient'
import TabSlideTransition from '@/components/animations/TabSlideTransition'

export default async function RoadmapPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <>
      <TabSlideTransition>
        <RoadmapClient />
      </TabSlideTransition>
    </>
  )
}
