'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import CustomCheckbox from '@/components/ui/CustomCheckbox'

export default function FloatingLoginCard() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true) // Start expanded
  const [isAnimating, setIsAnimating] = useState(false)
  const lastScrollY = useRef(0)
  const isTransitioning = useRef(false)
  const isExpandedRef = useRef(true) // Keep ref in sync
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Keep ref in sync with state
  useEffect(() => {
    isExpandedRef.current = isExpanded
  }, [isExpanded])

  // Track scroll to auto-collapse/expand with debouncing
  useEffect(() => {
    const handleScroll = () => {
      // Clear any pending timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // Debounce scroll handling
      scrollTimeoutRef.current = setTimeout(() => {
        // Prevent rapid toggling
        if (isTransitioning.current) return

        const scrollY = window.scrollY
        const scrollDirection = scrollY > lastScrollY.current ? 'down' : 'up'
        const scrollDelta = Math.abs(scrollY - lastScrollY.current)
        lastScrollY.current = scrollY

        // Only act on significant scroll movements (prevent micro-movements)
        if (scrollDelta < 5) return

        // Auto-collapse when scrolling down past 80px
        if (scrollY > 80 && isExpandedRef.current && scrollDirection === 'down') {
          isTransitioning.current = true
          setIsAnimating(true)
          setIsExpanded(false)
          setTimeout(() => {
            setIsAnimating(false)
            isTransitioning.current = false
          }, 500)
        }
        // Auto-expand when back at top (within 50px) and scrolling up
        else if (scrollY <= 50 && !isExpandedRef.current && scrollDirection === 'up') {
          isTransitioning.current = true
          setIsAnimating(true)
          setIsExpanded(true)
          setTimeout(() => {
            setIsAnimating(false)
            isTransitioning.current = false
          }, 500)
        }
      }, 50) // 50ms debounce
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, []) // Empty dependency array - only run once

  // Expose function to expand from scroll-to-top button
  useEffect(() => {
    const handleExpandLogin = () => {
      if (!isExpandedRef.current && !isTransitioning.current) {
        isTransitioning.current = true
        setIsAnimating(true)
        setIsExpanded(true)
        setTimeout(() => {
          setIsAnimating(false)
          isTransitioning.current = false
        }, 500)
      }
    }

    window.addEventListener('expandLogin', handleExpandLogin)
    return () => window.removeEventListener('expandLogin', handleExpandLogin)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message || 'An error occurred during login')
        setLoading(false)
        return
      }

      // Wait a moment for cookies to be set
      await new Promise(resolve => setTimeout(resolve, 100))

      // Refresh the session to ensure cookies are set
      const { data: sessionData } = await supabase.auth.getSession()

      if (sessionData?.session) {
        setLoading(false)
        // Use router.push first, then fallback to window.location if needed
        router.push('/dashboard')
        // Force a full page reload after a short delay to ensure server-side can read cookies
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 100)
      } else {
        setError('Session not established. Please try again.')
        setLoading(false)
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during login')
      setLoading(false)
    }
  }

  const handleToggle = () => {
    if (isTransitioning.current) return
    isTransitioning.current = true
    setIsAnimating(true)
    setIsExpanded(!isExpanded)
    setTimeout(() => {
      setIsAnimating(false)
      isTransitioning.current = false
    }, 500)
  }

  // Collapsed state - compact button with smooth animation
  if (!isExpanded) {
    return (
      <div
        className={`fixed top-4 right-4 z-50 transition-all duration-500 ease-out ${
          isAnimating ? 'animate-fade-in-scale' : 'opacity-100 scale-100'
        }`}
      >
        <button
          onClick={handleToggle}
          className="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2.5 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 flex items-center gap-2 group"
        >
          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sign In</span>
        </button>
      </div>
    )
  }

  // Expanded state - full form with smooth animation
  return (
    <div
      className={`fixed top-4 right-4 z-50 w-[360px] transition-all duration-500 ease-out ${
        isAnimating ? 'animate-slide-in-scale' : 'opacity-100 scale-100'
      }`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Sign In</h3>
              <p className="text-xs text-indigo-100">Welcome back</p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2.5 rounded-lg text-xs flex items-start gap-2 animate-fade-in">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-xs">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email-float" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email-float"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password-float" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password-float"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <CustomCheckbox id="remember-me" label="Remember me" />
            <Link href="#" className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
              Forgot?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="text-center pt-3 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/signup"
              className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
            >
              New? Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
