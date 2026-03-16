'use client'

import React from 'react'

type Props = { children: React.ReactNode }
type State = { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }

/**
 * Global error boundary. Does NOT auto-reload to avoid masking root cause and reload loops.
 * In development: shows error message and component stack for debugging.
 * In production: shows a polished fallback with manual "Reload" option.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState((s) => ({ ...s, errorInfo }))
    if (typeof console !== 'undefined') {
      console.error('FleetPulse ErrorBoundary:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development'
      const { error, errorInfo } = this.state

      return (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center bg-[#0d1120] text-white p-6 text-center z-[99999] overflow-auto"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <p className="text-lg font-medium mb-2">FleetPulse encountered an error.</p>
          {error && (
            <div className="text-left max-w-2xl w-full mb-4 p-4 bg-black/30 rounded-lg overflow-auto">
              <p className="text-red-300 font-mono text-sm break-all mb-2">{error.message}</p>
              {isDev && errorInfo?.componentStack && (
                <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono mt-2">{errorInfo.componentStack}</pre>
              )}
            </div>
          )}
          <p className="text-sm text-white/70 mb-4">
            {isDev ? 'Fix the error above and save to retry.' : 'Something went wrong. You can try reloading.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
          >
            Reload page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
