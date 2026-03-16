'use client'

import { Check, Lock } from 'lucide-react'

const templates = [
  { id: 'operations-standard', name: 'Operations Standard', description: 'Standard fleet ops dashboard: KPIs, alerts, recent inspections, driver feed', goodFor: 'Any fleet operation', price: 0 },
  { id: 'maintenance-focus', name: 'Maintenance Focus', description: 'Prioritizes oil status, due dates, and maintenance panels', goodFor: 'Maintenance-heavy fleets', price: 0 },
  { id: 'driver-centric', name: 'Driver-Centric', description: 'Emphasizes driver assignments and inspection rates', goodFor: 'Large driver pools', price: 0 },
  { id: 'executive-overview', name: 'Executive Overview', description: 'High-level KPIs and concise business summaries', goodFor: 'Ownership / C-level', price: 0 },
  { id: 'compact-ops', name: 'Compact Ops', description: 'Dense, data-rich layout for dispatch workflows', goodFor: 'Power dispatchers', price: 0 },
]

const marketplaceTemplates = [
  { id: 't1', name: 'Enterprise Operations Command', price: 39 },
  { id: 't2', name: 'Multi-Region Dispatch Pro', price: 29 },
  { id: 't3', name: 'Maintenance Intelligence Suite', price: 49 },
]

export default function TemplatesPage() {
  const selected = 'operations-standard'

  return (
    <div className="page-fade-in px-4 md:px-6 py-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Control Panel · Templates</p>
        <h1 className="text-2xl font-display font-bold text-white">Template Library</h1>
        <p className="text-sm text-slate-400 mt-1">Apply a dashboard/navigation preset to your company.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`card-glass rounded-2xl overflow-hidden group cursor-pointer hover:border-blue-500/30 transition-all ${
              selected === template.id ? 'border-blue-500/60 shadow-glow-blue' : ''
            }`}
          >
            <div className="aspect-[4/3] bg-navy-800/50 relative overflow-hidden p-4">
              <div className="grid grid-cols-3 gap-1 h-full">
                <div className="rounded bg-white/[0.08]" />
                <div className="rounded bg-white/[0.05] col-span-2" />
                <div className="rounded bg-white/[0.05] col-span-2" />
                <div className="rounded bg-white/[0.08]" />
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-white">{template.name}</h3>
                {template.price === 0
                  ? <span className="badge badge-active text-[10px]">Free</span>
                  : <span className="text-sm font-mono text-white">${template.price}</span>
                }
              </div>
              <p className="text-xs text-slate-500">{template.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-600">Good for: {template.goodFor}</span>
                {selected === template.id && <Check size={14} className="text-blue-400" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-display font-bold text-white">Template Marketplace</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Premium templates built by FleetPulse and verified partners
            </p>
          </div>
          <span className="badge badge-neutral">Coming Soon</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketplaceTemplates.map((t) => (
            <div key={t.id} className="card-glass rounded-2xl overflow-hidden opacity-60 relative">
              <div className="absolute inset-0 bg-navy-900/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <div className="text-center">
                  <Lock size={20} className="text-slate-400 mx-auto mb-2" />
                  <span className="text-xs text-slate-400">Marketplace launching soon</span>
                </div>
              </div>
              <div className="aspect-[4/3] bg-navy-800/50 p-4">
                <div className="h-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-sm text-white font-semibold">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Premium template</p>
                  <p className="text-sm text-white font-mono mt-3">${t.price}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

