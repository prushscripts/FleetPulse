'use client'

import { motion, AnimatePresence } from 'framer-motion'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[240] p-4 flex items-center justify-center"
          style={{ background: 'rgba(4,8,16,0.8)', backdropFilter: 'blur(10px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            className="w-full max-w-md card-glass rounded-2xl p-6 shadow-modal"
          >
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="text-sm text-slate-400 mt-2">{description}</p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={onCancel}>
                {cancelLabel}
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  variant === 'danger'
                    ? 'bg-red-500/90 hover:bg-red-500 text-white'
                    : 'btn-primary'
                }`}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

