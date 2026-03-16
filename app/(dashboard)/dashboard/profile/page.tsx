import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TabSlideTransition from '@/components/animations/TabSlideTransition'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <TabSlideTransition>
      <ProfileClient />
    </TabSlideTransition>
  )
}
