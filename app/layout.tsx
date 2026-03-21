import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { PageTransitionProvider } from '@/components/animations/PageTransition'
import ErrorBoundary from '@/components/ErrorBoundary'
import BackgroundLayer from '@/components/BackgroundLayer'
import ToastProvider from '@/components/ui/ToastProvider'
import ConfirmProvider from '@/components/ui/ConfirmProvider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'FleetPulse — Modern Fleet Management',
  description: 'Real-time fleet visibility, digital inspections, driver management, and fleet health analytics. The modern fleet management platform for logistics teams.',
  metadataBase: new URL('https://fleetpulsehq.com'),
  openGraph: {
    title: 'FleetPulse — Modern Fleet Management',
    description: 'Real-time fleet visibility, digital inspections, driver management, and fleet health analytics.',
    url: 'https://fleetpulsehq.com',
    siteName: 'FleetPulse',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'FleetPulse — Modern Fleet Management Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FleetPulse — Modern Fleet Management',
    description: 'Real-time fleet visibility, digital inspections, driver management, and fleet health analytics.',
    images: ['/opengraph-image'],
  },
  icons: {
    icon: [
      { url: '/branding/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/branding/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/branding/favicon.ico' },
    ],
    apple: '/branding/apple-touch-icon.png',
    shortcut: '/branding/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="icon" href="/branding/favicon.ico" />
        <link rel="shortcut icon" href="/branding/favicon.ico" />
      </head>
      <body className={`${inter.className} overflow-x-hidden min-h-full`}>
        <ThemeProvider>
          <ErrorBoundary>
            <ToastProvider>
              <ConfirmProvider>
                <BackgroundLayer />
                <div className="relative z-10 min-h-full overflow-x-hidden">
                  <PageTransitionProvider>
                    {children}
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
