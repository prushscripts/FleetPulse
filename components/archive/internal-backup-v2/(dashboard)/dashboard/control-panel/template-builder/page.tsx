import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TabSlideTransition from '@/components/animations/TabSlideTransition'
import TemplateBuilderClient from './TemplateBuilderClient'
import type { CustomTemplate } from '@/lib/custom-template'

export default async function TemplateBuilderPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const companyId = user.user_metadata?.company_id as string | undefined
  const companySettings = (user.user_metadata?.company_settings as Record<
    string,
    { customTemplate?: CustomTemplate }
  >) || {}
  const customTemplate = companyId ? companySettings[companyId]?.customTemplate ?? null : null

  return (
    <>
      <TabSlideTransition>
        <TemplateBuilderClient companyId={companyId ?? null} initialTemplate={customTemplate} />
      </TabSlideTransition>
    </>
  )
}
