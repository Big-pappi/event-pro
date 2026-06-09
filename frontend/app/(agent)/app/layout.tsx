'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Palette,
  Send,
  BarChart3,
} from 'lucide-react'
import { DashboardShell, type NavItem } from '@/components/app/shell'
import { useRequireRole } from '@/lib/auth'

const nav: NavItem[] = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/app/events', label: 'Events', icon: CalendarDays },
  { href: '/app/invitees', label: 'Invitees', icon: Users },
  { href: '/app/templates', label: 'Templates', icon: Palette },
  { href: '/app/send', label: 'Send invitations', icon: Send },
  { href: '/app/campaigns', label: 'Campaigns', icon: BarChart3 },
]

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useRequireRole('agent')

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <DashboardShell nav={nav} title="InvitePro">
      {children}
    </DashboardShell>
  )
}
