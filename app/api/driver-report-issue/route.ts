import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Body = {
  title: string
  description?: string | null
  priority?: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as Body
    const title = typeof body?.title === 'string' ? body.title.trim() : ''
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: driver } = await admin
      .from('drivers')
      .select('id')
      .eq('email', user.email ?? '')
      .maybeSingle()

    if (!driver) {
      return NextResponse.json({ error: 'Driver record not found' }, { status: 403 })
    }

    const { data: vehicle } = await admin
      .from('vehicles')
      .select('id, code, company_id, location')
      .or(`driver_id.eq.${driver.id},assigned_driver_id.eq.${driver.id}`)
      .limit(1)
      .maybeSingle()

    if (!vehicle) {
      return NextResponse.json({ error: 'No vehicle assigned to you' }, { status: 403 })
    }

    const priority = ['low', 'medium', 'high', 'critical'].includes(body?.priority ?? '')
      ? body.priority
      : 'medium'

    const { error } = await admin.from('issues').insert({
      vehicle_id: vehicle.id,
      title,
      description: body?.description?.trim() || null,
      status: 'open',
      priority,
      reported_date: new Date().toISOString().slice(0, 10),
      source: 'manual',
    })

    if (error) {
      console.error('driver-report-issue error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const companyId = (vehicle as { company_id?: string }).company_id
    const vehicleLocation = (vehicle as { location?: string }).location ?? null
    const vehicleCode = (vehicle as { code?: string }).code ?? ''
    const driverName =
      (user.user_metadata?.nickname as string)?.trim() ||
      (user.email ?? '').split('@')[0] ||
      'Driver'

    if (companyId) {
      try {
        const { data: managers } = await admin
          .from('profiles')
          .select('id, territory')
          .eq('company_id', companyId)
          .in('role', ['owner', 'manager'])

        if (managers?.length) {
          const recipients = vehicleLocation
            ? managers.filter(
                (m) =>
                  !(m as { territory?: string }).territory ||
                  (m as { territory?: string }).territory === vehicleLocation
              )
            : managers
          if (recipients.length) {
            await admin.from('notifications').insert(
              recipients.map((m) => ({
                company_id: companyId,
                recipient_user_id: m.id,
                type: 'issue_reported',
                title: `Issue reported — ${vehicleCode || 'Vehicle'}`,
                body: `${driverName} reported: ${title}`,
                data: {
                  vehicle_id: vehicle.id,
                  vehicle_number: vehicleCode,
                  driver_name: driverName,
                },
                recipient_territory: vehicleLocation,
                read: false,
                deleted: false,
              }))
            )
          }
        }
      } catch (notifErr) {
        console.error('driver-report-issue notification error:', notifErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('driver-report-issue error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
