import { MarketingNav } from '@/components/marketing/nav'
import { Hero } from '@/components/marketing/hero'
import { Features } from '@/components/marketing/features'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { Pricing } from '@/components/marketing/pricing'
import { CtaFooter } from '@/components/marketing/cta-footer'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <MarketingNav />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <CtaFooter />
    </main>
  )
}
