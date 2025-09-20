"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Course } from "@/lib/types"

interface EnhancedCourseCardProps {
  course: Course
  showProgress?: boolean
  progress?: number
}

const engineColors = {
  unity: "bg-black text-white",
  unreal: "bg-blue-600 text-white",
  godot: "bg-blue-500 text-white",
  custom: "bg-gray-600 text-white"
}

const difficultyColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
}

export function EnhancedCourseCard({ course, showProgress = false, progress = 0 }: EnhancedCourseCardProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <Link href={`/courses/${course.id}`} className="group block">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white rounded-2xl cursor-pointer"
            style={{
              boxShadow: 'rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.2) 0px 4px 32px -12px'
            }}>
        <div className="relative">
          {/* Course Image */}
          <div className="aspect-video overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl">
            <Image
              src={course.thumbnail}
              alt={course.title}
              width={400}
              height={225}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={`${engineColors[course.engine]} text-xs font-medium`}>
              {course.engine.charAt(0).toUpperCase() + course.engine.slice(1)}
            </Badge>
          </div>

          <div className="absolute top-3 right-3">
            <Badge
              variant="secondary"
              className={`${difficultyColors[course.difficulty]} text-xs font-medium`}
            >
              {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
            </Badge>
          </div>

          {/* Price Badge */}
          <div className="absolute bottom-3 right-3 bg-black/80 text-white px-3 py-1 rounded-full text-sm font-medium">
            {course.price === 0 ? "Free" : `$${course.price}`}
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Course Title & Instructor - Paper Design Inspired */}
          <div className="text-center space-y-1">
            <h3
              className="font-black text-xl leading-7 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2"
              style={{
                fontFamily: '"Inter Tight", system-ui, sans-serif',
                fontWeight: 900
              }}
            >
              {course.title}
            </h3>
            <p
              className="text-lg text-gray-900 font-normal leading-7"
              style={{
                fontFamily: '"Inter Tight", system-ui, sans-serif',
                fontWeight: 400
              }}
            >
              {course.instructor.name}
            </p>
          </div>

          {/* Metadata Row - Paper Design Style */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
            <span className="font-normal" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
              {course.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            <span>•</span>
            <span className="font-normal" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
              {formatDuration(course.duration)}
            </span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="font-normal" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
                {course.rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Progress (if enrolled) */}
          {showProgress && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-gray-100">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </Progress>
            </div>
          )}

          {/* CTA Button */}
          <div className="pt-2">
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 rounded-lg transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {showProgress ? "Continue Learning" : "View Course"}
            </Button>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 text-center leading-relaxed">
            {course.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 justify-center pt-1">
            {course.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs text-gray-500 border-gray-200">
                {tag}
              </Badge>
            ))}
            {course.tags.length > 3 && (
              <Badge variant="outline" className="text-xs text-gray-500 border-gray-200">
                +{course.tags.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}