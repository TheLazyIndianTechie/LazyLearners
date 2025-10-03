"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-grid opacity-40" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-coral-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />

      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen py-12">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Announcement Badge */}
            <Badge
              variant="outline"
              className="px-4 py-2 border-coral-400/50 bg-coral-400/10 text-coral-400 hover:bg-coral-400/20"
            >
              <span className="text-sm font-mono">🚀 Unity • Unreal • Godot</span>
            </Badge>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="heading-hero">
                Build Games.
                <br />
                <span className="gradient-text">
                  Level Up Skills.
                </span>
                <br />
                Ship Products.
              </h1>
              <p className="body-large text-slate-300 max-w-xl">
                Master game development with industry-grade courses.
                From pixel art to published titles—your journey starts here.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="px-4 sm:px-6 md:px-8 py-4 md:py-6 text-base md:text-lg min-h-[44px] bg-coral-400 hover:bg-coral-500 text-slate-950 font-semibold btn-glow group"
                asChild
              >
                <Link href="/courses">
                  Explore Courses
                  <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-4 sm:px-6 md:px-8 py-4 md:py-6 text-base md:text-lg min-h-[44px] border-2 border-slate-700 hover:border-cyan-400 hover:text-cyan-400"
                asChild
              >
                <Link href="/test/video">Watch Demo</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-slate-800">
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-coral-400">500K+</div>
                <div className="text-sm text-slate-400 uppercase tracking-wide">Learners</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-cyan-400">5K+</div>
                <div className="text-sm text-slate-400 uppercase tracking-wide">Courses</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-forest-400">50K+</div>
                <div className="text-sm text-slate-400 uppercase tracking-wide">Games</div>
              </div>
            </div>
          </motion.div>

          {/* Right: Isometric illustration or 3D visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="hidden lg:block"
          >
            <div className="relative aspect-square">
              {/* Placeholder for 3D animation or illustration */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-coral-400/20 via-cyan-400/20 to-forest-400/20 backdrop-blur-sm border border-slate-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-9xl opacity-10">🎮</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 pb-24">
          {[
            {
              icon: "🎮",
              title: "Engine Integration",
              description: "Direct Unity, Unreal, and Godot integration. Build and deploy right from your browser."
            },
            {
              icon: "👥",
              title: "Live Collaboration",
              description: "Real-time code sharing, voice chat, and synchronized dev environments for teams."
            },
            {
              icon: "🏆",
              title: "Portfolio & Certs",
              description: "WebGL hosting for your games plus industry-recognized certifications."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + (i * 0.1) }}
            >
              <Card className="group border-2 border-slate-800 bg-slate-900/50 hover:border-coral-400/50 card-lift">
                <CardContent className="p-6 space-y-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-coral-400/20 to-cyan-400/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="heading-card text-slate-50">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
