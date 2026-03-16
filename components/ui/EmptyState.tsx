'use client'

import { Plus, type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
        <Icon size={20} className="text-slate-500" />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="text-xs text-slate-500 max-w-xs">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="btn-primary text-sm mt-4 px-5 py-2.5 flex items-center gap-2"
        >
          <Plus size={14} />
          {action.label}
        </button>
      )}
    </div>
  )
}

