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
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('sync-profile error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
