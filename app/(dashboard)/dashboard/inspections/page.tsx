import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TabSlideTransition from '@/components/animations/TabSlideTransition'
import InspectionsClient from './InspectionsClient'

export default async function InspectionsPage() {
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
        <InspectionsClient />
      </TabSlideTransition>
    </>
  )
}
