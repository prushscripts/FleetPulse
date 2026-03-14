import { createClient } from '@/lib/supabase/server'
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
