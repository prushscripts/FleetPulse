'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/components/ThemeProvider'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <Image
                  src="/fplogo.png"
                  alt="FleetPulse"
                  width={120}
                  height={40}
                  className="h-8 w-auto transition-transform duration-200 group-hover:scale-105"
                  priority
                />
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              <Link
                href="/home"
                className="border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-200 rounded-t-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className="border-indigo-500 text-gray-900 dark:text-white bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/20 inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-colors duration-200 rounded-t-lg"
              >
                Vehicles
              </Link>
              <Link
                href="/dashboard/drivers"
                className="border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-200 rounded-t-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                Drivers
              </Link>
              <Link
                href="/dashboard/inspections"
                className="border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-200 rounded-t-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                Inspections
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-110 active:scale-95"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
