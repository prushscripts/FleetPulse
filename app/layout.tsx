import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FleetPulse - Fleet Management System',
  description: 'Internal fleet management web application for vehicle tracking and maintenance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
