import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ActivateClient from './ActivateClient'
import { getUserDisplayName } from '@/lib/user-utils'

export default async function ActivatePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const companyId = user.user_metadata?.company_id
  if (companyId) {
    redirect('/dashboard')
  }

  return <ActivateClient userDisplayName={getUserDisplayName(user)} />
}
