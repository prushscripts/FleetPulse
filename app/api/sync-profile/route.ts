import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Syncs the current user's role and company_id from user_metadata to the profiles table.
 * Call this after signup (and after updateUser when company is set) so RLS and driver layout work.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (user.user_metadata?.role as string) || 'owner'
    const companyId = (user.user_metadata?.company_id as string) || null
    const nickname = (user.user_metadata?.nickname as string | undefined) || null

    const admin = createAdminClient()
    const { error } = await admin
      .from('profiles')
      .upsert(
        {
          id: user.id,
          role,
          company_id: companyId,
        },
        { onConflict: 'id' }
      )

    if (error) {
      console.error('sync-profile error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If role is driver, ensure a drivers table record exists
    if (role === 'driver' && companyId && user.email) {
      const display = nickname?.trim() || user.email.split('@')[0]
      const parts = display.split(' ').filter(Boolean)
      const first_name = parts[0] || display
      const last_name = parts.slice(1).join(' ')

      const { data: existingDriver } = await admin
        .from('drivers')
        .select('id, user_id')
        .eq('email', user.email)
        .eq('company_id', companyId)
        .maybeSingle()

      if (!existingDriver) {
        await admin.from('drivers').insert({
          user_id: user.id,
          first_name,
          last_name,
          email: user.email,
          company_id: companyId,
          location: null,
          active: true,
          signed_citation_policy: false,
          is_ny_driver: false,
          is_dmv_driver: false,
        })
      } else {
        await admin
          .from('drivers')
          .update({ user_id: user.id })
          .eq('id', existingDriver.id)
          .is('user_id', null)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('sync-profile error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
