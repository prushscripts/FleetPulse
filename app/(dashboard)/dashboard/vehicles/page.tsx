import { redirect } from 'next/navigation'

/**
 * /dashboard/vehicles — fleet list lives on main dashboard for now.
 */
export default function VehiclesPage() {
  redirect('/dashboard')
}
