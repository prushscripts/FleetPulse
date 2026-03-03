import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HomeDashboardClient from './HomeDashboardClient'
import Navbar from '@/components/Navbar'

export default async function HomeDashboardPage() {
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
      <HomeDashboardClient />
    </>
  )
}
