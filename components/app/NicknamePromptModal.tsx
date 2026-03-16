'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, ArrowRight, Sparkles } from 'lucide-react'

interface Props {
  open: boolean
  onSave: (nickname: string) => Promise<void>
}

export default function NicknamePromptModal({ open, onSave }: Props) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatted = value.trim()
    ? value.trim().charAt(0).toUpperCase() + value.trim().slice(1)
    : ''

  const handleSubmit = async () => {
    if (!formatted || formatted.length < 2) {
      setError('Please enter at least 2 characters.')
      return
    }
    if (formatted.length > 30) {
      setError('Nickname must be 30 characters or less.')
      return
    }
    setLoading(true)
    try {
      await onSave(formatted)
    } catch (e) {
      setError('Failed to save. Please try again.')
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(4,8,16,0.85)', backdropFilter: 'blur(12px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full max-w-sm card-glass rounded-2xl p-8"
            style={{ boxShadow: '0 0 60px rgba(59,130,246,0.12), 0 24px 48px rgba(0,0,0,0.4)' }}
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <User size={22} className="text-blue-400" />
            </div>

            {/* Heading */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-display font-bold text-white mb-2">
                What should we call you?
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Your name will appear on vehicle notes, inspections, and
                issue reports so your team knows who made each update.
              </p>
            </div>

            {/* Input */}
            <div className="space-y-3 mb-6">
              <input
                type="text"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Enter your name or nickname"
                autoFocus
                maxLength={30}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl
                  text-sm text-white placeholder:text-slate-600
                  focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20
                  transition-all"
              />
              {/* Live preview */}
              {formatted && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                >
                  <Sparkles size={12} className="text-blue-400" />
                  <span className="text-xs text-slate-400">
                    Will appear as: <span className="text-white font-medium">{formatted}</span>
                  </span>
                </motion.div>
              )}
              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}
            </div>

            {/* Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !value.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Continue to FleetPulse
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-600 mt-4">
              You can change this anytime in your profile settings.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

