import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Body = {
  emails?: string[]
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as unknown as Body
    const raw = (body as Body | undefined)?.emails as unknown
    const emails = (Array.isArray(raw) ? raw : [])
      .map((e: unknown) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
      .filter((e): e is string => !!e)

    if (!emails.length) {
      return NextResponse.json({ flags: {} }, { status: 200 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (user.user_metadata?.role as string | undefined) ?? 'owner'
    if (role === 'driver') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (error) {
      return NextResponse.json({ flags: {} }, { status: 200 })
    }

    const userList = data?.users ?? []
    const flags: Record<string, boolean> = {}
    for (const u of userList) {
      const email = u.email?.toLowerCase()
      if (!email) continue
      if (!emails.includes(email)) continue
      flags[email] = (u.user_metadata?.is_admin as boolean | undefined) === true
    }

    return NextResponse.json({ flags }, { status: 200 })
  } catch (e) {
    console.error('driver-admin-flags error:', e)
    return NextResponse.json({ flags: {} }, { status: 200 })
  }
}

