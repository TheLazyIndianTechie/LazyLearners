"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />

      <div className="container relative">
        <div className="flex flex-col items-center text-center space-y-8 py-24 lg:py-32">
          {/* Announcement Badge */}
          <Badge variant="secondary" className="px-4 py-2">
            <span className="text-sm font-medium">🚀 Now supporting Unity, Unreal Engine & Godot</span>
          </Badge>

          {/* Main Heading */}
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              Master{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Game Development
              </span>{" "}
              with Expert-Led Courses
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Learn from industry professionals, build real games, and launch your career in game development.
              From Unity to Unreal Engine, master the tools that power the gaming industry.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="px-8 py-6 text-lg" asChild>
              <Link href="/courses">Start Learning Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg" asChild>
              <Link href="/demo">Watch Demo</Link>
            </Button>
            <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" asChild>
              <Link href="/test/video">🎬 Test Video Streaming</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12">
            <div className="space-y-2">
              <div className="text-3xl font-bold">500K+</div>
              <div className="text-sm text-muted-foreground">Students Learning</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold">5K+</div>
              <div className="text-sm text-muted-foreground">Expert Courses</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold">50K+</div>
              <div className="text-sm text-muted-foreground">Games Created</div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 pb-24">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🎮</span>
              </div>
              <h3 className="text-xl font-semibold">Game Engine Integration</h3>
              <p className="text-muted-foreground">
                Direct integration with Unity, Unreal Engine, and Godot. Build and deploy games right from the browser.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold">Real-time Collaboration</h3>
              <p className="text-muted-foreground">
                Work together on projects with live code sharing, voice chat, and synchronized development environments.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold">Portfolio & Certification</h3>
              <p className="text-muted-foreground">
                Showcase your games with WebGL hosting and earn industry-recognized certifications.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}