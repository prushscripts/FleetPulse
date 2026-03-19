import { redirect } from 'next/navigation'

/** Root /dashboard → inspection command center home */
export default function DashboardPage() {
  redirect('/dashboard/home')
}
