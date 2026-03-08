import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import RouteTransition from '@/components/RouteTransition'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://FleetPulseHQ.com'

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
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'FleetPulse – Modern Fleet Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FleetPulse – Modern Fleet Management',
    description: 'Track vehicles, manage maintenance, and keep your fleet running smoothly.',
    images: ['/opengraph-image'],
  },
  icons: {
    icon: '/fpfavicon.png',
    apple: '/fpfavicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={inter.className}>
        <ThemeProvider>
          <RouteTransition />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
