'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { useApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { currency } from '@/lib/utils'

type Plan = {
  id: string
  name: string
  price: number
  currency: string
  interval: string
  features: string[]
}

export function Pricing() {
  const { data: plans } = useApi<Plan[]>('/api/plans')

  return (
    <section id="pricing" className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple pricing that scales with you
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Start free. Upgrade when your events grow.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {(plans ?? []).map((plan) => {
            const featured = plan.id === 'pro'
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 ${
                  featured
                    ? 'border-primary shadow-lg shadow-primary/10'
                    : 'border-border'
                }`}
              >
                {featured && (
                  <Badge tone="primary" className="absolute -top-3 left-6">
                    Most popular
                  </Badge>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-serif text-4xl font-semibold">
                    {plan.price === 0 ? 'Free' : currency(plan.price, plan.currency)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-muted-foreground">
                      /{plan.interval}
                    </span>
                  )}
                </div>
                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="mt-6">
                  <Button
                    className="w-full"
                    variant={featured ? 'primary' : 'outline'}
                  >
                    {plan.price === 0 ? 'Get started' : `Choose ${plan.name}`}
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
