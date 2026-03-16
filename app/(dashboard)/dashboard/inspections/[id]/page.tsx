import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Printer } from 'lucide-react'

export default async function InspectionReportPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: inspection } = await supabase
    .from('inspections')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (!inspection) {
    return (
      <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto page-fade-in">
        <p className="text-slate-400">Inspection not found.</p>
      </div>
    )
  }

  const results = Array.isArray(inspection.results) ? inspection.results : []

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto page-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Inspection Report</p>
          <h1 className="text-2xl font-display font-bold text-white mt-1">
            {inspection.type === 'pre_trip' ? 'Pre-Trip' : inspection.type === 'post_trip' ? 'Post-Trip' : 'Custom'} · {inspection.id.slice(0, 8)}
          </h1>
        </div>
        <button onClick={() => window.print()} className="btn-ghost px-3 py-2 text-sm inline-flex items-center gap-2">
          <Printer size={14} /> Print
        </button>
      </div>

      <div className="card-glass rounded-2xl p-5 mb-4">
        <p className="text-sm text-slate-400">Submitted at {new Date(inspection.submitted_at).toLocaleString()}</p>
        <p className="text-sm text-slate-400 mt-1">Odometer: {(inspection.odometer ?? 0).toLocaleString()} mi</p>
        <span className={`badge mt-3 ${
          inspection.status === 'passed' ? 'badge-active' : inspection.status === 'failed' ? 'badge-danger' : 'badge-warning'
        }`}>
          {inspection.status}
        </span>
      </div>

      <div className="card-glass rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06] text-sm font-semibold text-white">Checklist Results</div>
        {results.length === 0 ? (
          <div className="px-4 py-5 text-sm text-slate-500">No item-level results available.</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {results.map((r: any, idx: number) => (
              <div key={`${r.itemId || idx}`} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-white">{r.label || 'Inspection item'}</div>
                  <span className={`badge ${r.passed ? 'badge-active' : 'badge-danger'}`}>
                    {r.passed ? 'Pass' : 'Fail'}
                  </span>
                </div>
                {r.note && <p className="text-xs text-slate-400 mt-1">{r.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <Link href="/dashboard/inspections" className="btn-ghost px-3 py-2 text-sm">Back to inspections</Link>
      </div>
    </div>
  )
}

