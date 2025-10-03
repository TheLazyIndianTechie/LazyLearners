"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Course } from "@/lib/types"

interface CourseCardProps {
  course: Course
  showProgress?: boolean
  progress?: number
}

const engineStyles = {
  unity: "bg-slate-950 text-slate-50 border-slate-700",
  unreal: "bg-cyan-400/20 text-cyan-400 border-cyan-400/50",
  godot: "bg-forest-400/20 text-forest-400 border-forest-400/50",
  custom: "bg-coral-400/20 text-coral-400 border-coral-400/50"
}

const difficultyStyles = {
  beginner: "bg-forest-400/20 text-forest-400 border-forest-400/50",
  intermediate: "bg-cyan-400/20 text-cyan-400 border-cyan-400/50",
  advanced: "bg-coral-400/20 text-coral-400 border-coral-400/50"
}

export function CourseCard({ course, showProgress = false, progress = 0 }: CourseCardProps) {
  return (
    <Card className="group relative overflow-hidden border-2 border-slate-800 bg-slate-900/50 hover:border-coral-400/50 card-lift">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-slate-800">
        <Image
          src={course.thumbnail}
          alt={course.title}
          width={400}
          height={225}
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Engine Badge */}
        <Badge className={`absolute top-3 left-3 border ${engineStyles[course.engine]} backdrop-blur-sm`}>
          <span className="font-mono text-xs uppercase">{course.engine}</span>
        </Badge>

        {/* Difficulty Badge */}
        <Badge className={`absolute top-3 right-3 border ${difficultyStyles[course.difficulty]} backdrop-blur-sm`}>
          <span className="font-mono text-xs uppercase">{course.difficulty}</span>
        </Badge>

        {/* Duration */}
        <div className="absolute bottom-3 right-3 bg-slate-950/90 backdrop-blur-sm text-slate-50 px-3 py-1.5 rounded-lg text-sm font-mono border border-slate-700">
          {Math.floor(course.duration / 60)}h {course.duration % 60}m
        </div>
      </div>

      <CardContent className="p-6 space-y-4">
        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="heading-card text-slate-50 line-clamp-2 group-hover:text-coral-400 transition-colors">
            {course.title}
          </h3>
          <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-slate-700">
            <AvatarImage src={course.instructor.avatar} alt={course.instructor.name} />
            <AvatarFallback className="bg-slate-800 text-slate-300 text-xs">
              {course.instructor.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-slate-400 font-medium">{course.instructor.name}</span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex text-coral-400 text-lg">
            {[...Array(5)].map((_, i) => (
              <span key={i}>{i < Math.floor(course.rating) ? "★" : "☆"}</span>
            ))}
          </div>
          <span className="text-sm font-mono font-semibold text-slate-300">{course.rating.toFixed(1)}</span>
          <span className="text-sm text-slate-400">({course.reviewCount})</span>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm font-mono">
              <span className="text-slate-400">Progress</span>
              <span className="text-coral-400 font-semibold">{progress}%</span>
            </div>
            <Progress
              value={progress}
              className="h-2 bg-slate-800"
            />
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-end justify-between pt-4 border-t border-slate-800">
          <div className="space-y-1">
            {course.price === 0 ? (
              <span className="text-2xl font-bold font-mono text-forest-400">FREE</span>
            ) : (
              <div className="space-y-0.5">
                <span className="text-2xl font-bold font-mono text-slate-50">${course.price}</span>
                {course.price > 50 && (
                  <div className="text-sm text-slate-500 line-through font-mono">
                    ${(course.price * 1.5).toFixed(0)}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            className="bg-coral-400 hover:bg-coral-500 text-slate-950 font-semibold btn-glow min-h-[44px] px-6"
            asChild
          >
            <Link href={`/courses/${course.id}`}>
              {showProgress ? "Continue" : "Enroll"}
            </Link>
          </Button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 pt-2">
          {course.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-xs border-slate-700 text-slate-400 hover:border-cyan-400 hover:text-cyan-400"
            >
              {tag.tag}
            </Badge>
          ))}
          {course.tags.length > 3 && (
            <Badge variant="outline" className="text-xs border-slate-700 text-slate-500">
              +{course.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
