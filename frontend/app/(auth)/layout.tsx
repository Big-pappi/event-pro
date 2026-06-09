import * as React from 'react'
import Link from 'next/link'
import { Logo } from '@/components/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Form side */}
      <div className="flex w-full flex-col px-6 py-8 sm:px-10 lg:w-1/2">
        <Link href="/" className="inline-flex">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      {/* Brand side */}
      <div className="relative hidden w-1/2 overflow-hidden bg-sidebar lg:block">
        <div className="absolute inset-0 flex flex-col justify-center px-12 text-sidebar-foreground">
          <div className="max-w-md">
            <h2 className="text-balance font-serif text-4xl font-semibold leading-tight">
              Every great event starts with a beautiful invitation.
            </h2>
            <p className="mt-5 text-pretty leading-relaxed text-sidebar-foreground/70">
              Design stunning cards, manage your guest list and deliver
              personalized invitations over WhatsApp, SMS and Email — all from one
              platform.
            </p>
            <dl className="mt-10 grid grid-cols-3 gap-6">
              {[
                { k: '12k+', v: 'Events created' },
                { k: '1.8M', v: 'Invites delivered' },
                { k: '98%', v: 'Delivery rate' },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="font-serif text-3xl font-semibold text-primary-foreground">
                    {s.k}
                  </dt>
                  <dd className="mt-1 text-sm text-sidebar-foreground/60">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
      </div>
    </div>
  )
}
