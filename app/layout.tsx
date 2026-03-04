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

export const metadata: Metadata = {
  title: 'FleetPulse - Fleet Management System',
  description: 'Modern fleet management platform for vehicle tracking and maintenance',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://FleetPulseHQ.com'),
  openGraph: {
    title: 'FleetPulse - Fleet Management System',
    description: 'Modern fleet management platform for vehicle tracking and maintenance',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://FleetPulseHQ.com',
    siteName: 'FleetPulse',
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
