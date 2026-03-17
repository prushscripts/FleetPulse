import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Body = {
  company_id: string
  enabled_tabs?: string[]
  custom_tab_labels?: Record<string, string>
  inspections_enabled?: boolean
  manager_access_code?: string | null
  driver_access_code?: string | null
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body
    const companyId = body?.company_id?.trim()
    if (!companyId) {
      return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const updates: Record<string, unknown> = {}
    if (Array.isArray(body.enabled_tabs)) updates.enabled_tabs = body.enabled_tabs
    if (body.custom_tab_labels !== undefined) updates.custom_tab_labels = body.custom_tab_labels
    if (typeof body.inspections_enabled === 'boolean') updates.inspections_enabled = body.inspections_enabled
    if (body.manager_access_code !== undefined) updates.manager_access_code = body.manager_access_code
    if (body.driver_access_code !== undefined) updates.driver_access_code = body.driver_access_code

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true })
    }

    const { error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)

    if (error) {
      console.error('update-company-config error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('update-company-config error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
