import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WelcomeClient from './WelcomeClient'

export default async function WelcomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (user.user_metadata?.company_id) {
    redirect('/dashboard')
  }

  return <WelcomeClient />
}
