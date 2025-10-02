import { SiteLayout } from "@/components/layout/site-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MessageSquare, Calendar, Trophy, BookOpen, Code2, Gamepad2, Star } from "lucide-react"
import Link from "next/link"

export default function CommunityPage() {
  return (
    <SiteLayout>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-background">
        <div className="container">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <Badge variant="secondary" className="px-4 py-2">
              <Users className="h-4 w-4 mr-2" />
              Join 15,000+ Game Developers
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              GameLearn Community
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Connect with fellow game developers, share your projects, get feedback, and grow together.
              Our community is where learning meets collaboration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg">
                <MessageSquare className="mr-2 h-5 w-5" />
                Join Discussions
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                <Trophy className="mr-2 h-5 w-5" />
                View Showcases
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">15,000+</div>
              <div className="text-sm text-muted-foreground">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2,500+</div>
              <div className="text-sm text-muted-foreground">Projects Shared</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Weekly Discussions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Expert Mentors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Features */}
      <section className="py-20">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold">Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From beginner-friendly discussions to advanced game development strategies
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Discussion Forums</CardTitle>
                <CardDescription>
                  Ask questions, share knowledge, and help others in topic-specific forums
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Unity Development</span>
                  <Badge variant="secondary">1.2k posts</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Game Design</span>
                  <Badge variant="secondary">856 posts</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Career Advice</span>
                  <Badge variant="secondary">543 posts</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                  <Gamepad2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Project Showcase</CardTitle>
                <CardDescription>
                  Share your games, get feedback, and discover incredible projects from the community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Indie Games</span>
                  <Badge variant="secondary">423 projects</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Game Jams</span>
                  <Badge variant="secondary">267 entries</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prototypes</span>
                  <Badge variant="secondary">189 demos</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                  <Code2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Code Reviews</CardTitle>
                <CardDescription>
                  Get your code reviewed by experienced developers and improve your skills
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">C# Scripts</span>
                  <Badge variant="secondary">234 reviews</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Shader Code</span>
                  <Badge variant="secondary">156 reviews</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Architecture</span>
                  <Badge variant="secondary">89 reviews</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Events & Workshops</CardTitle>
                <CardDescription>
                  Join live coding sessions, workshops, and community events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Weekly Workshops</span>
                  <Badge variant="secondary">Every Wed</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Game Jams</span>
                  <Badge variant="secondary">Monthly</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AMA Sessions</span>
                  <Badge variant="secondary">Bi-weekly</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle>Learning Groups</CardTitle>
                <CardDescription>
                  Study together in small groups and hold each other accountable
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Unity Beginners</span>
                  <Badge variant="secondary">45 members</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Advanced C#</span>
                  <Badge variant="secondary">28 members</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Game Art</span>
                  <Badge variant="secondary">67 members</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <CardTitle>Mentorship Program</CardTitle>
                <CardDescription>
                  Connect with experienced developers for 1-on-1 guidance and career advice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Mentors</span>
                  <Badge variant="secondary">52 experts</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mentorship Pairs</span>
                  <Badge variant="secondary">234 active</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate</span>
                  <Badge variant="secondary">89%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Guidelines */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl font-bold">Community Guidelines</h2>
            <p className="text-lg text-muted-foreground">
              Our community thrives on respect, collaboration, and mutual learning. Here's how we keep it awesome:
            </p>

            <div className="grid md:grid-cols-2 gap-6 mt-12">
              <div className="text-left space-y-3">
                <h3 className="font-semibold text-lg">✅ Do This:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Be respectful and constructive in feedback</li>
                  <li>• Share knowledge and help beginners</li>
                  <li>• Search before asking duplicate questions</li>
                  <li>• Use descriptive titles for your posts</li>
                  <li>• Credit others for their work and ideas</li>
                </ul>
              </div>
              <div className="text-left space-y-3">
                <h3 className="font-semibold text-lg">❌ Avoid This:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Spam, self-promotion without value</li>
                  <li>• Harassment or discriminatory behavior</li>
                  <li>• Sharing pirated content or assets</li>
                  <li>• Off-topic discussions in focused forums</li>
                  <li>• Demanding immediate responses</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center space-y-8 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold">Ready to Join the Community?</h2>
            <p className="text-lg text-muted-foreground">
              Start connecting with fellow developers, sharing your projects, and accelerating your game development journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg" asChild>
                <Link href="/auth/signup">
                  Join Community
                  <Users className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg" asChild>
                <Link href="/courses">
                  Browse Courses
                  <BookOpen className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}