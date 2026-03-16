import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = (user.user_metadata?.role as string | undefined) || 'owner'
  if (role !== 'driver') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <main className="px-4 py-6 pb-24 max-w-xl mx-auto page-fade-in">{children}</main>
    </div>
  )
}

