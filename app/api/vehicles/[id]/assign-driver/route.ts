import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const vehicleId = params.id
    const body = (await request.json()) as { driverId?: string }
    const driverId = body?.driverId?.trim()

    if (!vehicleId || !driverId) {
      return NextResponse.json({ error: 'Missing vehicle or driver id' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id, driver_id, assigned_driver_id')
      .eq('id', vehicleId)
      .maybeSingle()

    const { data: driver } = await supabase
      .from('drivers')
      .select('id, assigned_vehicle_id')
      .eq('id', driverId)
      .maybeSingle()

    if (!vehicle || !driver) {
      return NextResponse.json({ error: 'Vehicle or driver not found' }, { status: 404 })
    }

    const previousVehicleId = driver.assigned_vehicle_id as string | null
    if (previousVehicleId && previousVehicleId !== vehicleId) {
      await supabase
        .from('vehicles')
        .update({ assigned_driver_id: null, driver_id: null })
        .eq('id', previousVehicleId)
    }

    const previousDriverId = (vehicle.assigned_driver_id || vehicle.driver_id) as string | null
    if (previousDriverId && previousDriverId !== driverId) {
      await supabase
        .from('drivers')
        .update({ assigned_vehicle_id: null })
        .eq('id', previousDriverId)
    }

    const { error: vehicleErr } = await supabase
      .from('vehicles')
      .update({ assigned_driver_id: driverId, driver_id: driverId })
      .eq('id', vehicleId)
    if (vehicleErr) throw vehicleErr

    const { error: driverErr } = await supabase
      .from('drivers')
      .update({ assigned_vehicle_id: vehicleId })
      .eq('id', driverId)
    if (driverErr) throw driverErr

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to assign driver' }, { status: 500 })
  }
}

