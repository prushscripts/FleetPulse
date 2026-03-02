import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewVehicleClient from './NewVehicleClient'
import Navbar from '@/components/Navbar'

export default async function NewVehiclePage() {
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
      <NewVehicleClient />
    </>
  )
}
