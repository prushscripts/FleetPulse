import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FleetHealthClient from './FleetHealthClient'
import TabSlideTransition from '@/components/animations/TabSlideTransition'

export default async function FleetHealthPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <TabSlideTransition>
      <FleetHealthClient />
    </TabSlideTransition>
  )
}
