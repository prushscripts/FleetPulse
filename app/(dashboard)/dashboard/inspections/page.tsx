import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Inspections — FleetPulse' }
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
