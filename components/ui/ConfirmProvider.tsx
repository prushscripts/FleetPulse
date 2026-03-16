'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ConfirmVariant = 'danger' | 'default'

type ConfirmOptions = {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
}

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return ctx
}

export default function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolver, setResolver] = useState<((result: boolean) => void) | null>(null)

  const confirm = (opts: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      setOptions(opts)
      setResolver(() => resolve)
    })

  const close = (result: boolean) => {
    resolver?.(result)
    setOptions(null)
    setResolver(null)
  }

  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {options && (
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
              <h2 className="text-lg font-semibold text-white">{options.title}</h2>
              <p className="text-sm text-slate-400 mt-2">{options.description}</p>
              <div className="flex items-center justify-end gap-2 mt-6">
                <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => close(false)}>
                  {options.cancelLabel || 'Cancel'}
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    options.variant === 'danger'
                      ? 'bg-red-500/90 hover:bg-red-500 text-white'
                      : 'btn-primary'
                  }`}
                  onClick={() => close(true)}
                >
                  {options.confirmLabel || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}

