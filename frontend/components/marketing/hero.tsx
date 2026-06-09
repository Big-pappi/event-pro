import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MessageCircle, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div className="animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Trusted by event agents worldwide
          </span>
          <h1 className="mt-5 text-balance font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Design, send & track every event invitation in one place
          </h1>
          <p className="mt-5 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
            InvitePro gives event agents a Canva-style design studio, a powerful
            invitee CRM, and one-click delivery over WhatsApp, SMS and Email.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup">
              <Button size="lg">
                Start designing free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                View live demo
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" /> WhatsApp
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> SMS
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> Email
            </span>
          </div>
        </div>
        <div className="relative animate-fade-in">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-primary/5" />
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            <Image
              src="/hero-invitations.png"
              alt="Stack of beautifully designed event invitation cards"
              width={760}
              height={620}
              className="h-auto w-full"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
