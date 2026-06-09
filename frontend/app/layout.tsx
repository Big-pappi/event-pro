import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'InvitePro — Design, Send & Manage Event Invitations',
  description:
    'InvitePro is the all-in-one platform for event agents to design stunning invitations, manage invitees, and send them over WhatsApp, SMS and Email.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#6d3bf5',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} bg-background`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
