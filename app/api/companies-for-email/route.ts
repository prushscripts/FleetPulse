import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type CompaniesForEmailResponse = {
  companies: Array<{ id: string; name: string; displayName?: string }>
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!email) {
      return NextResponse.json({ companies: [] } as CompaniesForEmailResponse)
    }

    const supabase = createAdminClient()
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (error) {
      console.error('companies-for-email listUsers error:', error)
      return NextResponse.json({ companies: [] } as CompaniesForEmailResponse)
    }

    const user = users?.find((u) => u.email?.toLowerCase() === email) ?? null
    if (!user?.user_metadata?.companies) {
      return NextResponse.json({ companies: [] } as CompaniesForEmailResponse)
    }

    const list = user.user_metadata.companies as Array<{ id: string; name: string; displayName?: string }>
    const companies = Array.isArray(list)
      ? list.map((c) => ({
          id: c.id,
          name: c.name || 'Company',
          displayName: c.displayName,
        }))
      : []

    return NextResponse.json({ companies } as CompaniesForEmailResponse)
  } catch (e) {
    console.error('companies-for-email error:', e)
    return NextResponse.json({ companies: [] } as CompaniesForEmailResponse)
  }
}
