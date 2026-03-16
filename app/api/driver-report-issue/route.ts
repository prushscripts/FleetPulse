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
      .select('id, code')
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
    })

    if (error) {
      console.error('driver-report-issue error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('driver-report-issue error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
