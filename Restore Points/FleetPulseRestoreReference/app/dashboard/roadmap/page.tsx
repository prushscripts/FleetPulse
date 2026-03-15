import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import RoadmapClient from './RoadmapClient'
import TabSlideTransition from '@/components/TabSlideTransition'

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
      <Navbar />
      <TabSlideTransition>
        <RoadmapClient />
      </TabSlideTransition>
    </>
  )
}
