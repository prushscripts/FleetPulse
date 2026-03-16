import { redirect } from 'next/navigation'

/**
 * Dashboard home route: /dashboard/home lands on the main dashboard.
 * Redirects to /dashboard which renders the main dashboard view.
 */
export default function DashboardHomePage() {
  redirect('/dashboard')
}
