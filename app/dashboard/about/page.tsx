import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AboutClient from './AboutClient'

export default async function AboutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userEmail = user.email || 'User'
  const displayName = user.user_metadata?.full_name || userEmail.split('@')[0]

  return (
    <>
      <Navbar />
      <AboutClient displayName={displayName} />
    </>
  )
}
