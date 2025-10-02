"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Indie Game Developer",
    company: "Studio Pixel",
    content: "GameLearn transformed my career. I went from knowing nothing about game development to releasing my first commercial game in just 8 months. The real-time collaboration features were invaluable.",
    rating: 5,
    avatar: "SC"
  },
  {
    name: "Marcus Rodriguez",
    role: "Lead Unity Developer",
    company: "TechCorp Games",
    content: "The quality of courses here is exceptional. I've tried many platforms, but GameLearn's interactive approach and industry-relevant projects set it apart. Highly recommended for serious developers.",
    rating: 5,
    avatar: "MR"
  },
  {
    name: "Emma Thompson",
    role: "Game Design Student",
    company: "University of Arts",
    content: "As a student, I appreciate the affordable pricing and comprehensive curriculum. The portfolio hosting feature helped me land my first internship at a major gaming studio.",
    rating: 5,
    avatar: "ET"
  },
  {
    name: "David Kim",
    role: "Senior Developer",
    company: "Nexus Interactive",
    content: "Our entire team uses GameLearn for continuous learning. The enterprise features and team management tools make it perfect for professional development programs.",
    rating: 5,
    avatar: "DK"
  },
  {
    name: "Lisa Zhang",
    role: "Mobile Game Developer",
    company: "AppCraft Studios",
    content: "The Unity and Unreal courses are incredibly detailed. I learned advanced techniques that I immediately applied to my projects. The investment paid off within weeks.",
    rating: 5,
    avatar: "LZ"
  },
  {
    name: "Alex Johnson",
    role: "VR Developer",
    company: "VirtReality Inc",
    content: "GameLearn's cutting-edge content keeps me updated with the latest in VR and AR development. The instructors are industry veterans who know what they're talking about.",
    rating: 5,
    avatar: "AJ"
  }
]

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="px-4 py-2">
            <span className="text-sm font-medium">⭐ Loved by Developers</span>
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight">What Our Students Say</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it. Here's what game developers are saying about GameLearn Platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 space-y-4">
                {/* Rating */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: testimonial.rating }, (_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-muted-foreground leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <span className="text-primary-foreground font-semibold text-sm">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-border">
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">4.9/5</div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">15K+</div>
            <div className="text-sm text-muted-foreground">Reviews</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">98%</div>
            <div className="text-sm text-muted-foreground">Completion Rate</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">85%</div>
            <div className="text-sm text-muted-foreground">Career Success</div>
          </div>
        </div>
      </div>
    </section>
  )
}