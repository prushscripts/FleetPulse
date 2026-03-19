import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Fleet Health — FleetPulse' }
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
