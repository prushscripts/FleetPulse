'use client'

import React from 'react'
import Link from 'next/link'

type Props = { children: React.ReactNode }
type State = { hasError: boolean }

export default class DashboardErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (typeof console !== 'undefined') {
      console.error('Dashboard ErrorBoundary:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">Dashboard couldn’t load</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">Something went wrong. Try refreshing or heading back to the home page.</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Refresh
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
