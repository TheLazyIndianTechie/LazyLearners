import { SiteLayout } from "@/components/layout/site-layout"
import { HeroSection } from "@/components/hero/hero-section"
import { RecommendationsSection } from "@/components/course/recommendations-section"
import { TestimonialsSection } from "@/components/marketing/testimonials-section"
import { CTASection } from "@/components/marketing/cta-section"

export default function Home() {
  return (
    <SiteLayout>
      <HeroSection />
      <RecommendationsSection limit={8} />
      <TestimonialsSection />
      <CTASection />
    </SiteLayout>
  )
}
