import {
  Palette,
  Users,
  Send,
  QrCode,
  CalendarCheck,
  BarChart3,
} from 'lucide-react'
import { Card } from '@/components/ui/card'

const features = [
  {
    icon: Palette,
    title: 'Canva-style design studio',
    desc: 'Drag, drop and customize text, images, shapes and QR codes on a real canvas. Use dynamic variables to personalize every card.',
  },
  {
    icon: Users,
    title: 'Invitee CRM',
    desc: 'Organize guests into groups, import thousands via CSV, and track RSVPs in real time.',
  },
  {
    icon: Send,
    title: 'Multi-channel delivery',
    desc: 'Send personalized invitations over WhatsApp, SMS and Email from a single campaign flow.',
  },
  {
    icon: QrCode,
    title: 'QR check-in',
    desc: 'Every invitation carries a unique QR code so you can verify guests at the door instantly.',
  },
  {
    icon: CalendarCheck,
    title: 'Event management',
    desc: 'Create unlimited events, manage venues and schedules, and keep everything in sync.',
  },
  {
    icon: BarChart3,
    title: 'Delivery analytics',
    desc: 'See sent, delivered and opened rates per campaign with clear, actionable dashboards.',
  },
]

export function Features() {
  return (
    <section id="features" className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to run beautiful events
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            From the first design to the final guest check-in, InvitePro replaces
            five different tools with one focused platform.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="p-6 transition-shadow hover:shadow-md">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
