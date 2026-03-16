import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { PageTransitionProvider } from '@/components/animations/PageTransition'
import NavbarLayout from '@/components/layout/NavbarLayout'
import ErrorBoundary from '@/components/ErrorBoundary'
import BackgroundLayer from '@/components/BackgroundLayer'
import ToastProvider from '@/components/ui/ToastProvider'
import ConfirmProvider from '@/components/ui/ConfirmProvider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://FleetPulseHQ.com'
const ogImageUrl = `${siteUrl}/images/banner1.png`

export const metadata: Metadata = {
  title: 'FleetPulse - Fleet Management System',
  description: 'Modern fleet management platform for vehicle tracking and maintenance',
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'FleetPulse – Modern Fleet Management',
    description: 'Track vehicles, manage maintenance, and keep your fleet running smoothly. All in one powerful platform.',
    url: siteUrl,
    siteName: 'FleetPulse',
    images: [{ url: ogImageUrl, width: 2400, height: 1256, alt: 'FleetPulse – Modern Fleet Management' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FleetPulse – Modern Fleet Management',
    description: 'Track vehicles, manage maintenance, and keep your fleet running smoothly.',
    images: [ogImageUrl],
  },
  icons: {
    icon: '/branding/fleetpulse-icon-32.png',
    apple: '/branding/fleetpulse-icon-32.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={`${inter.className} overflow-x-hidden min-h-full`}>
        <ThemeProvider>
          <ErrorBoundary>
            <ToastProvider>
              <ConfirmProvider>
                <BackgroundLayer />
                <div className="relative z-10 min-h-full overflow-x-hidden">
                  <PageTransitionProvider>
                    <NavbarLayout>
                      <main>{children}</main>
                    </NavbarLayout>
                  </PageTransitionProvider>
                </div>
              </ConfirmProvider>
            </ToastProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
