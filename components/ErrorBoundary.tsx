'use client'

import React from 'react'

type Props = { children: React.ReactNode }
type State = { hasError: boolean }

export default class ErrorBoundary extends React.Component<Props, State> {
  private reloadScheduled = false

  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (typeof console !== 'undefined') {
      console.error('FleetPulse ErrorBoundary:', error, errorInfo)
    }
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    if (this.state.hasError && !prevState.hasError && typeof window !== 'undefined' && !this.reloadScheduled) {
      this.reloadScheduled = true
      setTimeout(() => window.location.reload(), 2000)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center bg-[#0d1120] text-white p-6 text-center z-[99999]"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <p className="text-lg font-medium mb-2">FleetPulse encountered an error.</p>
          <p className="text-sm text-white/70">Reloading...</p>
        </div>
      )
    }
    return this.props.children
  }
}
