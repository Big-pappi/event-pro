'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  ScrollText,
  Settings,
} from 'lucide-react'
import { DashboardShell, type NavItem } from '@/components/app/shell'
import { useRequireRole } from '@/lib/auth'

const nav: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/payments', label: 'Payments', icon: Receipt },
  { href: '/admin/logs', label: 'Audit logs', icon: ScrollText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useRequireRole('admin')

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <DashboardShell nav={nav} title="InvitePro Admin">
      {children}
    </DashboardShell>
  )
}
