import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AboutClient from './AboutClient'
import TabSlideTransition from '@/components/TabSlideTransition'

export default async function AboutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userEmail = user.email || 'User'
  const rawDisplayName = user.user_metadata?.full_name || userEmail.split('@')[0]
  const displayName = rawDisplayName.charAt(0).toUpperCase() + rawDisplayName.slice(1)

  return (
    <>
      <Navbar />
      <TabSlideTransition>
        <AboutClient displayName={displayName} />
      </TabSlideTransition>
    </>
  )
}
