'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import { apiPost } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import type { User } from '@/lib/types'

export default function SignupPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = React.useState<'details' | 'otp'>('details')
  const [loading, setLoading] = React.useState(false)
  const [form, setForm] = React.useState({
    name: '',
    company: '',
    email: '',
    password: '',
  })
  const [otp, setOtp] = React.useState('')
  const [pending, setPending] = React.useState<User | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { user } = await apiPost<{ token: string; user: User }>('/api/auth/signup', form)
      setPending(user)
      setStep('otp')
      toast('We sent a 6-digit code to your email. (Demo code: 123456)', 'info')
    } catch {
      toast('Could not create account. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.replace(/\s/g, '').length < 4) {
      toast('Enter the verification code to continue.', 'error')
      return
    }
    if (!pending) return
    login({
      id: pending.id,
      name: pending.name,
      email: pending.email,
      role: pending.role,
      plan_id: pending.plan_id,
      company: pending.company,
      avatar: pending.avatar,
    })
    toast('Account verified. Welcome to InvitePro!')
    router.replace('/app')
  }

  if (step === 'otp') {
    return (
      <div>
        <button
          onClick={() => setStep('details')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the 6-digit code we sent to{' '}
          <span className="font-medium text-foreground">{form.email}</span>.
        </p>
        <form onSubmit={verifyOtp} className="mt-8 flex flex-col gap-4">
          <div>
            <Label htmlFor="otp">Verification code</Label>
            <Input
              id="otp"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="text-center text-lg tracking-[0.5em]"
              maxLength={6}
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            Verify & continue
          </Button>
          <button
            type="button"
            onClick={() => toast('A new code has been sent. (Demo code: 123456)', 'info')}
            className="text-center text-sm text-primary hover:underline"
          >
            Resend code
          </button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Start designing and sending invitations in minutes.
      </p>
      <form onSubmit={submitDetails} className="mt-8 flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={form.name} onChange={set('name')} placeholder="Jane Doe" required />
        </div>
        <div>
          <Label htmlFor="company">Company / agency</Label>
          <Input
            id="company"
            value={form.company}
            onChange={set('company')}
            placeholder="Bloom Events Co."
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@company.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={set('password')}
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
        </div>
        <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
