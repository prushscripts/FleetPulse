import { User } from '@supabase/supabase-js'
import TabSlideTransition from '@/components/animations/TabSlideTransition'
import AdminClient from '@/app/(dashboard)/dashboard/admin/AdminClient'
import { getPreviewAdminData } from '@/lib/preview-admin-data'
import { PREVIEW_COMPANY_ID } from '@/lib/preview-company'

/** Mock user for preview so AdminClient can render (saves will fail without real auth). */
const PREVIEW_MOCK_USER = {
  id: 'preview-admin-view',
  email: null,
  user_metadata: { company_id: PREVIEW_COMPANY_ID },
} as unknown as User

/** Temporary public preview: admin tab with Wheelz Up data (view-only; saves require login). */
export default async function PreviewAdminPage() {
  let initialData: Awaited<ReturnType<typeof getPreviewAdminData>>
  try {
    initialData = await getPreviewAdminData()
  } catch (_e) {
    initialData = { company: null, vehicles: [], cardMappings: [], apiConfig: null }
  }

  return (
    <TabSlideTransition>
      <AdminClient user={PREVIEW_MOCK_USER} initialData={initialData} />
    </TabSlideTransition>
  )
}
