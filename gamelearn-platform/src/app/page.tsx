import { SiteLayout } from "@/components/layout/site-layout"
import { HeroSection } from "@/components/hero-section"
import { TestimonialsSection } from "@/components/marketing/testimonials-section"
import { CTASection } from "@/components/marketing/cta-section"

export default function Home() {
  return (
    <SiteLayout>
      <HeroSection />
      <TestimonialsSection />
      <CTASection />
    </SiteLayout>
  )
}
