import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Zap, Shield, Clock } from "lucide-react"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />

      {/* Accent gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-coral-400/10 via-cyan-400/10 to-forest-400/10" />

      <div className="container relative">
        <div className="text-center space-y-8 text-slate-50">
          <Badge variant="secondary" className="px-4 py-2 bg-coral-400 text-slate-950 border-coral-400/50">
            <span className="text-sm font-medium">🎯 Start Your Journey Today</span>
          </Badge>

          <div className="space-y-6 max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-50">
              Ready to Build Your First Game?
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed">
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
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-slate-700 text-slate-50 hover:bg-slate-800 hover:border-coral-400" asChild>
              <Link href="/courses">Explore Courses</Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            <Card className="bg-slate-900/80 border-slate-700 backdrop-blur-sm hover:border-coral-400 transition-colors">
              <CardContent className="p-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-lg bg-coral-400/20 flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-coral-400" />
                </div>
                <h3 className="font-semibold text-lg text-slate-50">Instant Access</h3>
                <p className="text-slate-400 text-sm">
                  Start coding immediately with our browser-based development environment
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-700 backdrop-blur-sm hover:border-cyan-400 transition-colors">
              <CardContent className="p-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-lg bg-cyan-400/20 flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-lg text-slate-50">No Risk</h3>
                <p className="text-slate-400 text-sm">
                  Start free, cancel anytime. Upgrade only when you're ready for more features
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-700 backdrop-blur-sm hover:border-forest-400 transition-colors">
              <CardContent className="p-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-lg bg-forest-400/20 flex items-center justify-center mx-auto">
                  <Clock className="h-6 w-6 text-forest-400" />
                </div>
                <h3 className="font-semibold text-lg text-slate-50">Learn Fast</h3>
                <p className="text-slate-400 text-sm">
                  Build your first game in weeks, not months, with our structured learning path
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 border-t border-slate-700">
            <p className="text-slate-400 text-sm mb-4">Trusted by developers at</p>
            <div className="flex flex-wrap justify-center items-center gap-8 text-slate-300">
              <div className="px-4 py-2 border border-slate-700 rounded-lg hover:border-coral-400 transition-colors">Unity Technologies</div>
              <div className="px-4 py-2 border border-slate-700 rounded-lg hover:border-coral-400 transition-colors">Epic Games</div>
              <div className="px-4 py-2 border border-slate-700 rounded-lg hover:border-coral-400 transition-colors">Indie Studios</div>
              <div className="px-4 py-2 border border-slate-700 rounded-lg hover:border-coral-400 transition-colors">Game Academies</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}