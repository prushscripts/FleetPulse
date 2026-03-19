import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Drivers — FleetPulse' }
import { redirect } from 'next/navigation'
import DriversClient from './DriversClient'
import TabSlideTransition from '@/components/animations/TabSlideTransition'

export default async function DriversPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const companyId = user.user_metadata?.company_id as string | undefined

  return (
    <>
      <TabSlideTransition>
        <DriversClient companyId={companyId} />
      </TabSlideTransition>
    </>
  )
}
