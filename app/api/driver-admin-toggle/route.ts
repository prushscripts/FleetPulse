import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Body = {
  email?: string
  isAdmin?: boolean
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const enabled = typeof body?.isAdmin === 'boolean' ? body.isAdmin : false

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (user.user_metadata?.role as string | undefined) ?? 'owner'
    // Drivers should never be able to flip admin privileges for other users.
    if (role === 'driver') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data: users, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (error) {
      return NextResponse.json({ error: 'Unable to lookup users' }, { status: 500 })
    }

    const target = (users ?? []).find((u) => u.email?.toLowerCase() === email) ?? null
    const targetId = target?.id
    if (!targetId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const companyId = (target?.user_metadata?.company_id as string | undefined) ?? null
    const nickname = (target?.user_metadata?.nickname as string | undefined) ?? null
    const display = (nickname?.trim() || email.split('@')[0]) ?? email.split('@')[0]
    const parts = display.split(' ').filter(Boolean)
    const first_name = parts[0] || display
    const last_name = parts.slice(1).join(' ')

    const nextRole = enabled ? 'owner' : 'driver'

    const { error: updateError } = await admin.auth.admin.updateUserById(targetId, {
      data: {
        is_admin: enabled,
        role: nextRole,
      },
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Keep profile + driver records consistent so the toggle immediately works.
    const { error: profileUpsertErr } = await admin.from('profiles').upsert(
      {
        id: targetId,
        role: nextRole,
        company_id: companyId,
      },
      { onConflict: 'id' },
    )
    if (profileUpsertErr) {
      // non-fatal; the client may still reflect access changes after refresh
      console.error('driver-admin-toggle profiles upsert error:', profileUpsertErr)
    }

    if (!enabled) {
      // Ensure a drivers table record exists when switching to driver portal.
      if (companyId) {
        const { data: existingDriver } = await admin
          .from('drivers')
          .select('id, user_id')
          .eq('email', email)
          .eq('company_id', companyId)
          .maybeSingle()

        if (!existingDriver) {
          await admin.from('drivers').insert({
            user_id: targetId,
            first_name,
            last_name,
            email,
            company_id: companyId,
            location: null,
            active: true,
            signed_citation_policy: false,
            is_ny_driver: false,
            is_dmv_driver: false,
          })
        } else {
          await admin.from('drivers').update({ user_id: targetId }).eq('id', existingDriver.id).is('user_id', null)
        }
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    console.error('driver-admin-toggle error:', e)
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}

