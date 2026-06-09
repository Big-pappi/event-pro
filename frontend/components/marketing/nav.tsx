'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

const links = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
]

export function MarketingNav() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2">
              <Link href="/login" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup" className="flex-1">
                <Button size="sm" className="w-full">
                  Start free
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
