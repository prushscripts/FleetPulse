import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'
import TabSlideTransition from '@/components/animations/TabSlideTransition'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const isAdmin = user.user_metadata?.is_admin === true

  if (!isAdmin) {
    redirect('/dashboard')
  }

  return (
    <>
      <TabSlideTransition>
        <AdminClient user={user} />
      </TabSlideTransition>
    </>
  )
}
