import { createAdminClient } from '@/lib/supabase/admin'
import type { VehicleWithStats } from '@/lib/dashboard-types'
import { PREVIEW_COMPANY_ID } from '@/lib/preview-company'

/**
 * Fetch fleet data for the preview company (Wheelz Up) using service role.
 * Used by the public /vehicles preview page.
 */
export async function getPreviewFleetData(): Promise<VehicleWithStats[]> {
  const supabase = createAdminClient()

  const [vehiclesRes, driversRes, issuesRes, documentsRes] = await Promise.all([
    supabase.from('vehicles').select('*').eq('company_id', PREVIEW_COMPANY_ID).order('code', { ascending: true }),
    supabase.from('drivers').select('id, first_name, last_name').eq('company_id', PREVIEW_COMPANY_ID),
    supabase.from('issues').select('vehicle_id, status'),
    supabase.from('documents').select('vehicle_id, expiration_date'),
  ])

  const vehiclesData = vehiclesRes.data ?? []
  const driversData = driversRes.data ?? []
  const issuesData = issuesRes.data ?? []
  const documentsData = documentsRes.data ?? []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const driversMap = new Map<string, string>()
  driversData.forEach((d) => driversMap.set(d.id, `${d.first_name} ${d.last_name}`))

  const vehiclesWithStats: VehicleWithStats[] = vehiclesData.map((vehicle) => {
    const openIssues = issuesData.filter(
      (i) => i.vehicle_id === vehicle.id && i.status !== 'resolved'
    ).length
    const expiredDocuments = documentsData.filter(
      (d) => d.vehicle_id === vehicle.id && d.expiration_date && new Date(d.expiration_date) < today
    ).length
    const allDocuments = documentsData.filter((d) => d.vehicle_id === vehicle.id).length

    const combined = `${vehicle.make || ''} ${vehicle.model || ''}`.toLowerCase()
    let vehicleType = 'other'
    if (combined.includes('van') || combined.includes('transit') || combined.includes('cargo')) vehicleType = 'van'
    else if (combined.includes('truck') || combined.includes('f-') || combined.includes('ram')) vehicleType = 'truck'
    else if (combined.includes('suv') || combined.includes('explorer') || combined.includes('tahoe')) vehicleType = 'suv'

    const groupGuess = vehicle.code?.toLowerCase().includes('dmv') ? 'DMV' : 'New York'

    return {
      ...vehicle,
      status: vehicle.status || 'active',
      open_issues_count: openIssues,
      expired_documents_count: expiredDocuments,
      documents_count: allDocuments,
      driver_name: vehicle.driver_id ? driversMap.get(vehicle.driver_id) ?? null : null,
      group_name: groupGuess as 'New York' | 'DMV',
      vehicle_type: vehicleType,
    }
  })

  return vehiclesWithStats
}
