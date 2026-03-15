import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import SettingsClient from './SettingsClient'
import TabSlideTransition from '@/components/TabSlideTransition'

export default async function SettingsPage() {
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
        <SettingsClient user={user} />
      </TabSlideTransition>
    </>
  )
}
