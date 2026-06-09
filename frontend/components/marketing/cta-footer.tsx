import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

export function CtaFooter() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl bg-sidebar px-6 py-14 text-center sm:px-12">
          <h2 className="mx-auto max-w-xl text-balance font-serif text-3xl font-semibold tracking-tight text-sidebar-foreground sm:text-4xl">
            Ready to send invitations your guests will remember?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-pretty text-sidebar-foreground/70">
            Join event agents using InvitePro to design, deliver and manage every
            celebration.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">Start free today</Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-sidebar-accent bg-transparent text-sidebar-foreground hover:bg-sidebar-accent"
              >
                Explore the demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} InvitePro. Crafted for unforgettable
            events.
          </p>
          <div className="flex gap-5 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Pricing
            </a>
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </>
  )
}
