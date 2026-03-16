'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type ToastType = 'success' | 'error' | 'info' | 'warning'

type ToastMessage = {
  id: string
  type: ToastType
  message: string
}

type ToastContextValue = {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}

const TOAST_STYLE: Record<ToastType, string> = {
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  error: 'border-red-500/20 bg-red-500/10 text-red-300',
  info: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
}

const TOAST_PROGRESS: Record<ToastType, string> = {
  success: 'from-emerald-500 to-emerald-300',
  error: 'from-red-500 to-red-300',
  info: 'from-blue-500 to-blue-300',
  warning: 'from-amber-500 to-amber-300',
}

const TOAST_ICON: Record<ToastType, ComponentType<{ size?: number; className?: string }>> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const push = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((prev) => [...prev, { id, type, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const api = useMemo<ToastContextValue>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
      warning: (m) => push('warning', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed z-[250] top-4 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 flex flex-col gap-2 w-[92vw] max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = TOAST_ICON[toast.type]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className={`rounded-xl border backdrop-blur-md shadow-card overflow-hidden ${TOAST_STYLE[toast.type]}`}
              >
                <div className="p-3 flex items-start gap-2.5">
                  <Icon size={16} className="mt-0.5 shrink-0" />
                  <p className="text-sm leading-relaxed flex-1">{toast.message}</p>
                  <button
                    type="button"
                    className="text-slate-500 hover:text-white transition-colors"
                    onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                    aria-label="Dismiss toast"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="h-[2px] bg-white/[0.05]">
                  <div className={`h-full bg-gradient-to-r ${TOAST_PROGRESS[toast.type]} animate-toast-progress`} />
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

