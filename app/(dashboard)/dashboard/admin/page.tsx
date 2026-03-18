import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'
import TabSlideTransition from '@/components/animations/TabSlideTransition'

type SearchParams = { tab?: string; inspection?: string; vehicle?: string }

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = (profile as { role?: string } | null)?.role ?? null
  const isAdmin = role === 'owner' || role === 'manager'

  if (!isAdmin) {
    redirect('/dashboard')
  }

  const params = await searchParams
  return (
    <>
      <TabSlideTransition>
        <AdminClient user={user} initialTab={params.tab} inspectionId={params.inspection} vehicleId={params.vehicle} />
      </TabSlideTransition>
    </>
  )
}
