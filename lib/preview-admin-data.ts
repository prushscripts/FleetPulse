import { createAdminClient } from '@/lib/supabase/admin'
import { PREVIEW_COMPANY_ID } from '@/lib/preview-company'
import type { AdminInitialData } from '@/app/(dashboard)/dashboard/admin/AdminClient'

export async function getPreviewAdminData(): Promise<AdminInitialData> {
  const supabase = createAdminClient()

  const [companyRes, vehiclesRes, cardsRes, configRes] = await Promise.all([
    supabase.from('companies').select('id, name, auth_key').eq('id', PREVIEW_COMPANY_ID).maybeSingle(),
    supabase.from('vehicles').select('id, code').eq('company_id', PREVIEW_COMPANY_ID).order('code', { ascending: true }),
    supabase.from('voyager_card_mappings').select('*').order('card_number', { ascending: true }),
    supabase.from('voyager_api_config').select('*').limit(1).maybeSingle(),
  ])

  return {
    company: companyRes.data ?? null,
    vehicles: vehiclesRes.data ?? [],
    cardMappings: cardsRes.data ?? [],
    apiConfig: configRes.data ?? null,
  }
}
