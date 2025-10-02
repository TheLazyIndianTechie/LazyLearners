import { SiteLayout } from "@/components/layout/site-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Code2,
  Users,
  Video,
  Trophy,
  Zap,
  Shield,
  Globe,
  Gamepad2,
  MessageSquare,
  BarChart3,
  Cloud,
  Headphones
} from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Features - GameLearn Platform",
  description: "Discover all the powerful features that make GameLearn the best platform for learning game development.",
}

export default function FeaturesPage() {
  return (
    <SiteLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted/30 py-24">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />

        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-2">
              <span className="text-sm font-medium">🚀 Cutting-Edge Technology</span>
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Master Game Development
              </span>
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              From beginner tutorials to advanced collaboration tools, our platform provides
              everything you need to learn, create, and share amazing games.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-24">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Core Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The essential tools and features that power your game development learning journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <Video className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle>Interactive Video Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  High-quality video tutorials with interactive coding exercises, quizzes, and real-time feedback
                  to reinforce your learning.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                  <Code2 className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle>Browser-Based Development</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Code directly in your browser with our integrated development environment supporting
                  Unity, Unreal Engine, and Godot projects.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle>Real-Time Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Work together with classmates and mentors in real-time with live code sharing,
                  voice chat, and synchronized development environments.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-orange-500" />
                </div>
                <CardTitle>Portfolio & Certification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Showcase your games with WebGL hosting, build an impressive portfolio,
                  and earn industry-recognized certifications.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-red-500" />
                </div>
                <CardTitle>Instant Deployment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Deploy your games instantly to the web with one click. Share with friends,
                  family, or potential employers immediately.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-cyan-500" />
                </div>
                <CardTitle>Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Detailed analytics of your learning progress with completion rates,
                  skill assessments, and personalized recommendations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Advanced Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional-grade tools for serious game developers and teams.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Gamepad2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">Multi-Engine Support</h3>
                  <p className="text-muted-foreground">
                    Learn Unity, Unreal Engine, Godot, and more with engine-specific courses
                    and integrated development tools tailored for each platform.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">Live Mentorship</h3>
                  <p className="text-muted-foreground">
                    Get help from experienced game developers through live chat, video calls,
                    and code review sessions. Never get stuck for too long.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">Enterprise Security</h3>
                  <p className="text-muted-foreground">
                    Bank-level security with SSO integration, team management,
                    and compliance features for educational institutions and companies.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Cloud className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">Cloud Synchronization</h3>
                  <p className="text-muted-foreground">
                    Your projects, progress, and settings are automatically synchronized
                    across all devices. Pick up where you left off, anywhere.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">Global Community</h3>
                  <p className="text-muted-foreground">
                    Join a worldwide community of game developers. Share projects,
                    get feedback, and participate in game jams and competitions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Headphones className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">24/7 Support</h3>
                  <p className="text-muted-foreground">
                    Get help whenever you need it with our responsive support team,
                    comprehensive documentation, and active community forums.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Comparison */}
      <section className="py-24">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Why Choose GameLearn?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how we compare to other learning platforms.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-4">
                <h3 className="font-semibold">Platform</h3>
                <div className="space-y-3 text-sm">
                  <div className="py-2">Interactive Learning</div>
                  <div className="py-2">Real-time Collaboration</div>
                  <div className="py-2">Multi-Engine Support</div>
                  <div className="py-2">Portfolio Hosting</div>
                  <div className="py-2">Live Mentorship</div>
                  <div className="py-2">Browser-based IDE</div>
                  <div className="py-2">Community Features</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-primary">GameLearn</h3>
                <div className="space-y-3 text-sm">
                  <div className="py-2 text-green-500">✓ Advanced</div>
                  <div className="py-2 text-green-500">✓ Yes</div>
                  <div className="py-2 text-green-500">✓ Unity, Unreal, Godot</div>
                  <div className="py-2 text-green-500">✓ WebGL Hosting</div>
                  <div className="py-2 text-green-500">✓ 24/7 Available</div>
                  <div className="py-2 text-green-500">✓ Full-Featured</div>
                  <div className="py-2 text-green-500">✓ Global</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-muted-foreground">Platform A</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="py-2">✓ Basic</div>
                  <div className="py-2">✗ Limited</div>
                  <div className="py-2">✓ Unity Only</div>
                  <div className="py-2">✗ No</div>
                  <div className="py-2">✓ Limited Hours</div>
                  <div className="py-2">✗ No</div>
                  <div className="py-2">✓ Forums Only</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-muted-foreground">Platform B</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="py-2">✓ Good</div>
                  <div className="py-2">✗ No</div>
                  <div className="py-2">✓ Unity, Unreal</div>
                  <div className="py-2">✓ Basic</div>
                  <div className="py-2">✗ No</div>
                  <div className="py-2">✗ No</div>
                  <div className="py-2">✓ Basic</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <div className="container">
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Experience All Features Today</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start with our free plan and discover why thousands of developers choose GameLearn
              for their game development education.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg" asChild>
                <Link href="/auth/signup">Try Free Now</Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}