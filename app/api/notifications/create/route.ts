import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Body = {
  company_id: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
  territory?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body
    const { company_id, type, title, body: bodyText, data, territory } = body

    if (!company_id || !type || !title || !bodyText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data: managers, error: managersError } = await supabase
      .from('profiles')
      .select('id, territory')
      .eq('company_id', company_id)
      .in('role', ['owner', 'manager'])

    if (managersError) {
      console.error('notifications/create profiles error:', managersError)
      return NextResponse.json({ error: managersError.message }, { status: 500 })
    }

    if (!managers?.length) {
      return NextResponse.json({ success: true, sent: 0 })
    }

    const recipients = territory
      ? managers.filter(
          (m) =>
            !(m as { territory?: string }).territory ||
            (m as { territory?: string }).territory === territory
        )
      : managers

    const notifications = recipients.map((m) => ({
      company_id,
      recipient_user_id: m.id,
      type,
      title,
      body: bodyText,
      data: data ?? {},
      recipient_territory: territory ?? null,
      read: false,
      deleted: false,
    }))

    const { error } = await supabase.from('notifications').insert(notifications)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, sent: notifications.length })
  } catch (e: unknown) {
    console.error('notifications/create error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
