import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { PageTransitionProvider } from '@/components/animations/PageTransition'
import NavbarLayout from '@/components/layout/NavbarLayout'
import IntroAnimation from '@/components/IntroAnimation'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://FleetPulseHQ.com'
// Link preview when you text the link = FleetPulse card (transparent banner)
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
    images: [
      {
        url: ogImageUrl,
        width: 2400,
        height: 1256,
        alt: 'FleetPulse – Modern Fleet Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FleetPulse – Modern Fleet Management',
    description: 'Track vehicles, manage maintenance, and keep your fleet running smoothly.',
    images: [ogImageUrl],
  },
  icons: {
    icon: '/branding/favicon.ico',
    apple: '/branding/fleetpulse-icon-32.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={`${inter.className} overflow-x-hidden`}>
        <ThemeProvider>
          <IntroAnimation>
            <PageTransitionProvider>
              <NavbarLayout>
                {children}
              </NavbarLayout>
            </PageTransitionProvider>
          </IntroAnimation>
        </ThemeProvider>
      </body>
    </html>
  )
}
