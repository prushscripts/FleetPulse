import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const vehicleId = params.id
    if (!vehicleId) {
      return NextResponse.json({ error: 'Missing vehicle id' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id, driver_id, assigned_driver_id')
      .eq('id', vehicleId)
      .maybeSingle()

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    const currentDriverId = (vehicle.assigned_driver_id || vehicle.driver_id) as string | null

    const { error: vehicleErr } = await supabase
      .from('vehicles')
      .update({ assigned_driver_id: null, driver_id: null })
      .eq('id', vehicleId)
    if (vehicleErr) throw vehicleErr

    if (currentDriverId) {
      await supabase
        .from('drivers')
        .update({ assigned_vehicle_id: null })
        .eq('id', currentDriverId)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to unassign driver' }, { status: 500 })
  }
}

