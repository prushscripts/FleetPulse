import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { code, role } = await req.json()

  if (!code || !role) {
    return NextResponse.json(
      { valid: false, error: 'Missing code or role' },
      { status: 400 }
    )
  }

  const supabase = createRouteHandlerClient({ cookies })

  // Find company by either manager or driver code
  const codeColumn =
    role === 'manager' ? 'manager_access_code' : role === 'driver' ? 'driver_access_code' : null

  if (!codeColumn) {
    return NextResponse.json(
      { valid: false, error: 'Invalid role' },
      { status: 400 },
    )
  }

  const { data: company, error } = await supabase
    .from('companies')
    .select('id, name, manager_access_code, driver_access_code')
    .eq(codeColumn, String(code).trim())
    .single()

  if (error || !company) {
    return NextResponse.json({
      valid: false,
      error: 'Invalid access code. Contact your administrator.',
    })
  }

  return NextResponse.json({
    valid: true,
    company_id: company.id,
    company_name: company.name,
  })
}
