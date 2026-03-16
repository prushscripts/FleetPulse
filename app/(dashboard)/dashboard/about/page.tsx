import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AboutClient from './AboutClient'
import TabSlideTransition from '@/components/animations/TabSlideTransition'

export default async function AboutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <>
      <TabSlideTransition>
        <AboutClient />
      </TabSlideTransition>
    </>
  )
}
