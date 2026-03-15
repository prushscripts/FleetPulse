import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VehicleDetailClient from './VehicleDetailClient'
import Navbar from '@/components/Navbar'

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
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
      <VehicleDetailClient vehicleId={params.id} />
    </>
  )
}
