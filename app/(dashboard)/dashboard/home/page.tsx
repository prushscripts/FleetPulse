import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TabSlideTransition from '@/components/animations/TabSlideTransition'
import DashboardErrorBoundary from '../DashboardErrorBoundary'
import DashboardHomeClient, { type HomeInspection, type HomeDriver } from './DashboardHomeClient'
import type { Vehicle } from '@/lib/dashboard-types'

export const metadata: Metadata = { title: 'Home — FleetPulse' }

export default async function DashboardHomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const companyId = user.user_metadata?.company_id as string | undefined
  if (!companyId) {
    redirect('/login')
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [{ data: vehiclesData }, { data: driversData }, { data: inspectionsData }] = await Promise.all([
    supabase.from('vehicles').select('*').eq('company_id', companyId).order('code', { ascending: true }),
    supabase.from('drivers').select('id, first_name, last_name, user_id').eq('company_id', companyId),
    supabase
      .from('inspections')
      .select('id, vehicle_id, driver_id, type, status, submitted_at')
      .eq('company_id', companyId)
      .gte('submitted_at', sevenDaysAgo.toISOString())
      .order('submitted_at', { ascending: false }),
  ])

  const vehicles = (vehiclesData || []) as Vehicle[]

  return (
    <DashboardErrorBoundary>
      <TabSlideTransition>
        <DashboardHomeClient
          companyId={companyId}
          initialVehicles={vehicles}
          initialDrivers={(driversData || []) as HomeDriver[]}
          initialInspections={(inspectionsData || []) as HomeInspection[]}
        />
      </TabSlideTransition>
    </DashboardErrorBoundary>
  )
}
