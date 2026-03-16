import TabSlideTransition from '@/components/animations/TabSlideTransition'
import Link from 'next/link'

/** Temporary public preview: admin placeholder (requires real user). */
export default function PreviewAdminPage() {
  return (
    <TabSlideTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Admin</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sign in as an admin to view and manage company settings, Voyager cards, and API config.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </TabSlideTransition>
  )
}
