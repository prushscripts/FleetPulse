'use client'

/**
 * Temporary layout for public preview routes (/vehicles, /drivers, etc.).
 * No auth; same top padding as dashboard so navbar aligns.
 */
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full pt-[64px] relative">
      <div className="bg-indigo-600/90 text-white text-center text-xs py-1.5 px-2 border-b border-indigo-500/50">
        View-only preview — sign in for full access
      </div>
      <div className="animate-tab-enter">
        {children}
      </div>
    </div>
  )
}
