import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VehicleDetailClient from './VehicleDetailClient'

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
      <VehicleDetailClient vehicleId={params.id} />
    </>
  )
}
