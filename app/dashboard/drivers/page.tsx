import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DriversClient from './DriversClient'
import Navbar from '@/components/Navbar'

export default async function DriversPage() {
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
      <DriversClient />
    </>
  )
}
