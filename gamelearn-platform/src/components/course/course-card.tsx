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

export function CourseCard({ course, showProgress = false, progress = 0 }: CourseCardProps) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
      <div className="relative">
        <div className="aspect-video overflow-hidden">
          <Image
            src={course.thumbnail}
            alt={course.title}
            width={400}
            height={225}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Engine Badge */}
        <Badge className={`absolute top-3 left-3 ${engineColors[course.engine]}`}>
          {course.engine.charAt(0).toUpperCase() + course.engine.slice(1)}
        </Badge>

        {/* Difficulty Badge */}
        <Badge
          variant="secondary"
          className={`absolute top-3 right-3 ${difficultyColors[course.difficulty]}`}
        >
          {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
        </Badge>

        {/* Duration */}
        <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-sm">
          {Math.floor(course.duration / 60)}h {course.duration % 60}m
        </div>
      </div>

      <CardContent className="p-6 space-y-4">
        {/* Course Title & Description */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {course.description}
          </p>
        </div>

        {/* Instructor */}
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={course.instructor.avatar} alt={course.instructor.name} />
            <AvatarFallback>
              {course.instructor.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{course.instructor.name}</span>
        </div>

        {/* Rating & Reviews */}
        <div className="flex items-center space-x-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < Math.floor(course.rating) ? "★" : "☆"}>★</span>
            ))}
          </div>
          <span className="text-sm font-medium">{course.rating.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">({course.reviewCount} reviews)</span>
        </div>

        {/* Progress (if enrolled) */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-1">
            {course.price === 0 ? (
              <span className="text-lg font-bold text-green-600">Free</span>
            ) : (
              <>
                <span className="text-lg font-bold">${course.price}</span>
                {course.price > 50 && (
                  <div className="text-sm text-muted-foreground line-through">
                    ${(course.price * 1.5).toFixed(0)}
                  </div>
                )}
              </>
            )}
          </div>

          <Button asChild>
            <Link href={`/courses/${course.id}`}>
              {showProgress ? "Continue" : "Enroll Now"}
            </Link>
          </Button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 pt-2">
          {course.tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs">
              {tag.tag}
            </Badge>
          ))}
          {course.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{course.tags.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}