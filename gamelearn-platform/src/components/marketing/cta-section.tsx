import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Zap, Shield, Clock } from "lucide-react"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-br from-primary to-primary/80">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />

      <div className="container relative">
        <div className="text-center space-y-8 text-white">
          <Badge variant="secondary" className="px-4 py-2 bg-white/20 text-white border-white/30">
            <span className="text-sm font-medium">🎯 Start Your Journey Today</span>
          </Badge>

          <div className="space-y-6 max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Ready to Build Your First Game?
            </h2>
            <p className="text-xl text-primary-foreground/80 leading-relaxed">
              Join thousands of developers who have already launched successful games with GameLearn Platform.
              Start your free account today and begin creating.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" asChild>
              <Link href="/auth/signup">
                Start Learning Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-white/30 text-white hover:bg-white/10" asChild>
              <Link href="/courses">Explore Courses</Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg text-white">Instant Access</h3>
                <p className="text-primary-foreground/80 text-sm">
                  Start coding immediately with our browser-based development environment
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg text-white">No Risk</h3>
                <p className="text-primary-foreground/80 text-sm">
                  Start free, cancel anytime. Upgrade only when you're ready for more features
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center mx-auto">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg text-white">Learn Fast</h3>
                <p className="text-primary-foreground/80 text-sm">
                  Build your first game in weeks, not months, with our structured learning path
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 border-t border-white/20">
            <p className="text-primary-foreground/60 text-sm mb-4">Trusted by developers at</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="px-4 py-2 border border-white/20 rounded-lg">Unity Technologies</div>
              <div className="px-4 py-2 border border-white/20 rounded-lg">Epic Games</div>
              <div className="px-4 py-2 border border-white/20 rounded-lg">Indie Studios</div>
              <div className="px-4 py-2 border border-white/20 rounded-lg">Game Academies</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}