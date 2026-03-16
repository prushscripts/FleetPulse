import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export type CompanyConfigRow = {
  id: string
  name: string
  auth_key: string
  display_name: string | null
  trial_ends_at: string | null
  created_at?: string
  updated_at?: string
  enabled_tabs?: string[] | null
  custom_tab_labels?: Record<string, string> | null
  inspections_enabled?: boolean | null
  [key: string]: unknown
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')?.trim()
    if (!companyId) {
      return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .maybeSingle()

    if (error) {
      console.error('company-config error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json(data as CompanyConfigRow)
  } catch (e) {
    console.error('company-config error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
