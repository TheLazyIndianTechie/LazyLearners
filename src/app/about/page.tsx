import { SiteLayout } from "@/components/layout/site-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const metadata = {
  title: "About GameLearn Platform - Revolutionizing Game Development Education",
  description: "Learn about our mission to democratize game development education through innovative technology and expert instruction.",
}

export default function AboutPage() {
  return (
    <SiteLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted/30 py-24">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />

        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-2">
              <span className="text-sm font-medium">🚀 Established 2024</span>
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
              Democratizing{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Game Development
              </span>{" "}
              Education
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              We believe game development skills should be accessible to everyone. Our platform combines
              cutting-edge technology with expert instruction to create the world&apos;s most comprehensive
              game development learning experience.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">Our Mission</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  To democratize game development education by providing world-class learning experiences
                  that are accessible, practical, and industry-relevant. We&apos;re building the future of
                  creative education.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🎯</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Practical Learning</h3>
                    <p className="text-muted-foreground">
                      Every course focuses on building real games and practical skills that translate directly to industry work.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🌍</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Global Accessibility</h3>
                    <p className="text-muted-foreground">
                      Breaking down barriers to education with affordable pricing and support for multiple languages and platforms.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🤝</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Community Driven</h3>
                    <p className="text-muted-foreground">
                      Building a supportive community where learners collaborate, share knowledge, and grow together.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-8 flex items-center justify-center">
                <div className="text-8xl opacity-20">🎮</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Meet Our Team</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Industry veterans and passionate educators working together to create the best learning experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Team Member 1 */}
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/60 mx-auto flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-foreground">VV</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Vinay Vidyasagar</h3>
                  <p className="text-muted-foreground">Founder & Lead Developer</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Full-stack developer with 5+ years of experience building educational platforms and game development tools.
                </p>
              </CardContent>
            </Card>

            {/* Team Member 2 */}
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500 to-green-400 mx-auto flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">JD</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Jane Developer</h3>
                  <p className="text-muted-foreground">Head of Education</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Former Unity instructor with 8+ years in game development education and curriculum design.
                </p>
              </CardContent>
            </Card>

            {/* Team Member 3 */}
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-400 mx-auto flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">MS</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Mike Smith</h3>
                  <p className="text-muted-foreground">Senior Game Developer</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  AAA game industry veteran who worked on popular titles and now teaches advanced game development techniques.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                <span className="text-3xl">💡</span>
              </div>
              <h3 className="font-semibold text-lg">Innovation</h3>
              <p className="text-muted-foreground">
                Constantly pushing the boundaries of what&apos;s possible in educational technology.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <span className="text-3xl">🌟</span>
              </div>
              <h3 className="font-semibold text-lg">Quality</h3>
              <p className="text-muted-foreground">
                Delivering only the highest quality content and learning experiences.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="font-semibold text-lg">Community</h3>
              <p className="text-muted-foreground">
                Building a supportive environment where everyone can learn and grow.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="font-semibold text-lg">Growth</h3>
              <p className="text-muted-foreground">
                Helping every learner achieve their full potential in game development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <div className="container">
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Ready to Start Learning?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of students who are already building amazing games with our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg" asChild>
                <Link href="/courses">Explore Courses</Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg" asChild>
                <Link href="/contact">Get in Touch</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}