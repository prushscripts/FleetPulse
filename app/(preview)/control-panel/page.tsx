import TabSlideTransition from '@/components/animations/TabSlideTransition'
import Link from 'next/link'

/** Temporary public preview: control panel placeholder (requires company context). */
export default function PreviewControlPanelPage() {
  return (
    <TabSlideTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Control Panel</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sign in and select a company to configure tabs, labels, and inspection settings.
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
