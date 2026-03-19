import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Body = {
  title: string
  body: string
  /** all | ny | dmv | profile UUID for one driver */
  recipient: string
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

    const companyId = user.user_metadata?.company_id as string | undefined
    if (!companyId?.trim()) {
      return NextResponse.json({ error: 'No company' }, { status: 400 })
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    const role = (profile as { role?: string } | null)?.role
    if (role !== 'owner' && role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as Body
    const title = typeof body?.title === 'string' ? body.title.trim() : ''
    const text = typeof body?.body === 'string' ? body.body.trim() : ''
    const recipient = typeof body?.recipient === 'string' ? body.recipient.trim() : 'all'

    if (!title || !text) {
      return NextResponse.json({ error: 'Title and body required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const isBroadcastKey = recipient === 'all' || recipient === 'ny' || recipient === 'dmv'

    if (!isBroadcastKey) {
      const { data: recipientProfile, error: rpErr } = await admin
        .from('profiles')
        .select('id, company_id, role')
        .eq('id', recipient)
        .maybeSingle()

      if (rpErr) {
        return NextResponse.json({ error: rpErr.message }, { status: 500 })
      }
      const p = recipientProfile as { id?: string; company_id?: string; role?: string } | null
      if (!p?.id || p.company_id !== companyId) {
        return NextResponse.json({ error: 'Invalid recipient' }, { status: 403 })
      }

      const { error } = await admin.from('notifications').insert({
        company_id: companyId,
        recipient_user_id: recipient,
        type: 'announcement',
        title,
        body: text,
        read: false,
        deleted: false,
        data: {},
        recipient_territory: null,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true, sent: 1 })
    }

    let territoryFilter: string | null = null
    if (recipient === 'ny') territoryFilter = 'New York'
    if (recipient === 'dmv') territoryFilter = 'DMV'

    const { data: driverProfiles, error: driversErr } = await admin
      .from('profiles')
      .select('id, territory')
      .eq('company_id', companyId)
      .eq('role', 'driver')

    if (driversErr) {
      return NextResponse.json({ error: driversErr.message }, { status: 500 })
    }

    let recipients = driverProfiles ?? []
    if (territoryFilter) {
      recipients = recipients.filter((r) => {
        const t = (r as { territory?: string }).territory?.trim()
        return !t || t === territoryFilter
      })
    }

    if (recipients.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }

    const rows = recipients.map((r) => ({
      company_id: companyId,
      recipient_user_id: (r as { id: string }).id,
      type: 'announcement',
      title,
      body: text,
      read: false,
      deleted: false,
      data: {},
      recipient_territory: territoryFilter,
    }))

    const { error: insErr } = await admin.from('notifications').insert(rows)
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, sent: rows.length })
  } catch (e) {
    console.error('manager-send error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
