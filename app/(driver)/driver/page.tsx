import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClipboardCheck, Truck } from 'lucide-react'
import DriverReportIssue from './DriverReportIssue'

export default async function DriverHomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const nickname = ((user.user_metadata?.nickname as string | undefined) || '').trim()
  const displayName = nickname || user.email || 'Driver'
  const companyId = user.user_metadata?.company_id as string | undefined

  // Greeting should be based on New York time (EST/ET), not server/container time.
  const now = new Date()
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      hour12: false,
    }).format(now),
  )
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const { data: driver } = await supabase
    .from('drivers')
    .select('id, first_name, last_name, location')
    .eq('email', user.email ?? '')
    .maybeSingle()

  const driverId = driver?.id
  const { data: assignedVehicle } = driverId
    ? await supabase
        .from('vehicles')
        .select('id, code, make, model, year, current_mileage, oil_change_due_mileage')
        .eq('driver_id', driverId)
        .maybeSingle()
    : { data: null as any }

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body, created_at')
    .eq('company_id', companyId ?? '')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(3)

  const { data: recentInspections } = driverId
    ? await supabase
        .from('inspections')
        .select('id, type, status, submitted_at')
        .eq('driver_id', driverId)
        .order('submitted_at', { ascending: false })
        .limit(5)
    : { data: [] as any[] }

  const oilOverdue =
    (assignedVehicle?.current_mileage ?? 0) >= (assignedVehicle?.oil_change_due_mileage ?? Number.MAX_SAFE_INTEGER)

  return (
    <div className="min-h-screen bg-[#0A0F1E] pt-6 pb-24 px-4 space-y-0">
      <header className="mb-4">
        <h1 className="text-2xl font-display font-bold text-white">
          {greeting}, {displayName} 👋
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {assignedVehicle?.code ? `You're assigned to ${assignedVehicle.code}` : 'No assigned vehicle yet'}
        </p>
      </header>

      <section className="card-glass rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Truck size={20} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white font-mono">
              {assignedVehicle?.code || 'Unassigned'}
            </h2>
            <p className="text-sm text-slate-400">
              {assignedVehicle
                ? `${assignedVehicle.year ?? ''} ${assignedVehicle.make ?? ''} ${assignedVehicle.model ?? ''}`
                : 'Please contact management for assignment.'}
            </p>
            {assignedVehicle && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-500 font-mono">
                  {(assignedVehicle.current_mileage ?? 0).toLocaleString()} mi
                </span>
                <span className={`badge ${oilOverdue ? 'badge-danger' : 'badge-active'}`}>
                  {oilOverdue ? 'Oil Overdue' : 'Oil OK'}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-4 space-y-2">
        <Link
          href="/driver/inspection/pre_trip"
          className="btn-primary w-full py-5 flex items-center justify-center gap-2 text-sm"
        >
          🚛 Start Pre-Trip Inspection
        </Link>
        <Link
          href="/driver/inspection/post_trip"
          className="btn-ghost w-full py-5 flex items-center justify-center gap-2 text-sm"
        >
          🏁 Start Post-Trip Inspection
        </Link>
        <DriverReportIssue vehicleId={assignedVehicle?.id ?? null} vehicleCode={assignedVehicle?.code ?? null} />
      </section>

      <section className="mt-6 card-glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Announcements</h3>
        <div className="space-y-2">
          {(announcements || []).length === 0 && (
            <p className="text-xs text-slate-500">No active announcements.</p>
          )}
          {(announcements || []).map((a: any) => (
            <article key={a.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-sm text-white font-medium">{a.title}</p>
              <p className="text-xs text-slate-400 mt-1">{a.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-4 card-glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Recent Check-ins</h3>
        <div className="space-y-2">
          {(recentInspections || []).length === 0 && (
            <p className="text-xs text-slate-500">No inspections submitted yet.</p>
          )}
          {(recentInspections || []).map((i: any) => (
            <div key={i.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.06] px-3 py-2">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={13} className="text-slate-500" />
                <span className="text-xs text-white">{i.type === 'pre_trip' ? 'Pre-Trip' : 'Post-Trip'}</span>
              </div>
              <span className={`badge ${
                i.status === 'passed' ? 'badge-active' : i.status === 'failed' ? 'badge-danger' : 'badge-warning'
              }`}>{i.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

