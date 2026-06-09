'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EventForm } from '@/components/app/event-form'
import { PageHeader } from '@/components/app/page-header'

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/app/events"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Link>
      <PageHeader title="Create event" description="Set up the details for your new event." />
      <EventForm />
    </div>
  )
}
