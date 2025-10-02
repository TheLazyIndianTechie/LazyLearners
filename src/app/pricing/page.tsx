import { SiteLayout } from "@/components/layout/site-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Pricing - GameLearn Platform",
  description: "Choose the perfect plan for your game development learning journey. Start free or upgrade for advanced features.",
}

export default function PricingPage() {
  return (
    <SiteLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted/30 py-24">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />

        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-2">
              <span className="text-sm font-medium">💎 Start Free, Upgrade Anytime</span>
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
              Simple{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Transparent
              </span>{" "}
              Pricing
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              Start your game development journey for free. Upgrade when you&apos;re ready for advanced features
              and unlimited access to our premium content.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="relative border-2">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">Free</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground mt-2">Perfect for getting started</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Access to 5 free courses</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Basic Unity tutorials</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Community forum access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Progress tracking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Basic portfolio features</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/auth/signup">Get Started Free</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-2 border-primary shadow-lg scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="px-4 py-1">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground mt-2">For serious game developers</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Access to 100+ premium courses</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Unity, Unreal & Godot courses</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Live coding sessions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Real-time collaboration tools</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Premium portfolio hosting</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Priority support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Downloadable course materials</span>
                  </div>
                </div>
                <Button className="w-full" asChild>
                  <Link href="/checkout?plan=pro">Start Pro Trial</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative border-2">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground mt-2">For teams and organizations</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Everything in Pro</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Up to 25 team members</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Team management dashboard</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Custom learning paths</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Advanced analytics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>SSO integration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Dedicated account manager</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/contact?plan=enterprise">Contact Sales</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about our pricing and plans.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Can I switch plans anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle,
                and we&apos;ll prorate any differences.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Is there a free trial for Pro?</h3>
              <p className="text-muted-foreground">
                Absolutely! We offer a 14-day free trial for our Pro plan. No credit card required to start,
                and you can cancel anytime during the trial period.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
                All payments are processed securely through our payment partners.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Can I cancel my subscription anytime?</h3>
              <p className="text-muted-foreground">
                Yes, you can cancel your subscription at any time from your account settings.
                You&apos;ll continue to have access until the end of your current billing period.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Do you offer student discounts?</h3>
              <p className="text-muted-foreground">
                Yes! We offer a 50% discount for students with a valid student ID.
                Contact our support team with your student verification for the discount code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Ready to Start Building Games?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of game developers who are already creating amazing projects with GameLearn Platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg" asChild>
                <Link href="/auth/signup">Start Free Trial</Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg" asChild>
                <Link href="/courses">View All Courses</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}