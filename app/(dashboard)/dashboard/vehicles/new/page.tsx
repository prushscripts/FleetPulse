import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewVehicleClient from './NewVehicleClient'
import Navbar from '@/components/layout/Navbar'

export default async function NewVehiclePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const companyId = user.user_metadata?.company_id as string | undefined

  return (
    <>
      <Navbar />
      <NewVehicleClient companyId={companyId} />
    </>
  )
}
