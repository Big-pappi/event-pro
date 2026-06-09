'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { apiPost } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import type { User } from '@/lib/types'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = React.useState('amara@bloomevents.co')
  const [password, setPassword] = React.useState('demo1234')
  const [loading, setLoading] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { user } = await apiPost<{ token: string; user: User }>('/api/auth/login', {
        email,
        password,
      })
      login({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan_id: user.plan_id,
        company: user.company,
        avatar: user.avatar,
      })
      toast(`Welcome back, ${user.name.split(' ')[0]}!`)
      router.replace(user.role === 'admin' ? '/admin' : '/app')
    } catch {
      toast('Could not sign in. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to continue designing and sending invitations.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="mb-1.5 text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>

      <div className="mt-6 rounded-[var(--radius)] border border-border bg-muted/60 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Demo accounts</p>
        <p className="mt-1">Agent: amara@bloomevents.co</p>
        <p>Admin: admin@invitepro.app</p>
        <p className="mt-1 text-muted-foreground/80">Any password works in this demo.</p>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to InvitePro?{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
