"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Play, Lock, ArrowLeft, ArrowRight } from "lucide-react"
import { useProgress } from "@/hooks/use-progress"

interface Lesson {
  id: string
  title: string
  description: string
  type: "VIDEO" | "QUIZ" | "ASSIGNMENT"
  order: number
  duration: number
  videoUrl?: string
  isCompleted?: boolean
  isFree?: boolean
}

interface LessonNavigationProps {
  lessons: Lesson[]
  currentLessonId: string
  onLessonChange: (lessonId: string) => void
  isEnrolled: boolean
}

export function LessonNavigation({
  lessons,
  currentLessonId,
  onLessonChange,
  isEnrolled
}: LessonNavigationProps) {
  const { markCompleted } = useProgress()

  const currentIndex = lessons.findIndex(lesson => lesson.id === currentLessonId)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < lessons.length - 1

  const handlePrevious = () => {
    if (hasPrevious) {
      onLessonChange(lessons[currentIndex - 1].id)
    }
  }

  const handleNext = () => {
    if (hasNext) {
      onLessonChange(lessons[currentIndex + 1].id)
    }
  }

  const handleMarkCompleted = async () => {
    if (currentLessonId) {
      try {
        await markCompleted(currentLessonId)
      } catch (error) {
        console.error("Failed to mark lesson as completed:", error)
      }
    }
  }

  const canAccessLesson = (lesson: Lesson) => {
    return lesson.isFree || isEnrolled
  }

  return (
    <div className="space-y-6">
      {/* Navigation Buttons */}
      <nav className="flex justify-between items-center" aria-label="Lesson navigation">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={!hasPrevious}
          className="flex items-center gap-2"
          aria-label={hasPrevious ? `Go to previous lesson: ${lessons[currentIndex - 1]?.title}` : "No previous lesson"}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Previous Lesson
        </Button>

        <Button
          onClick={handleMarkCompleted}
          className="bg-green-600 hover:bg-green-700 text-white"
          aria-label={`Mark ${lessons[currentIndex]?.title} as complete`}
        >
          <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
          Mark as Complete
        </Button>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={!hasNext}
          className="flex items-center gap-2"
          aria-label={hasNext ? `Go to next lesson: ${lessons[currentIndex + 1]?.title}` : "No next lesson"}
        >
          Next Lesson
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      </nav>

      {/* Lesson List */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4" id="lesson-list-heading">Course Lessons</h3>
          <ul className="space-y-3" role="list" aria-labelledby="lesson-list-heading">
            {lessons.map((lesson, index) => {
              const isActive = lesson.id === currentLessonId
              const canAccess = canAccessLesson(lesson)
              const statusLabel = lesson.isCompleted ? "Completed" : isActive ? "Currently playing" : canAccess ? "Available" : "Locked"
              const durationMinutes = Math.floor(lesson.duration / 60)
              const durationSeconds = lesson.duration % 60

              return (
                <li
                  key={lesson.id}
                  role="button"
                  tabIndex={canAccess ? 0 : -1}
                  aria-disabled={!canAccess}
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`Lesson ${index + 1}: ${lesson.title}. ${statusLabel}. Duration: ${durationMinutes} minutes ${durationSeconds} seconds. ${lesson.type === "QUIZ" ? "Quiz lesson." : ""} ${lesson.isFree ? "Free preview." : ""}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isActive
                      ? "border-blue-200 bg-blue-50"
                      : canAccess
                      ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                  }`}
                  onClick={() => canAccess && onLessonChange(lesson.id)}
                  onKeyDown={(e) => {
                    if (canAccess && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      onLessonChange(lesson.id)
                    }
                  }}
                >
                  {/* Lesson Number */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium" aria-hidden="true">
                    {lesson.isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : canAccess ? (
                      isActive ? (
                        <Play className="w-4 h-4 text-blue-600" />
                      ) : (
                        index + 1
                      )
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  {/* Lesson Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium truncate ${
                        isActive ? "text-blue-900" : canAccess ? "text-gray-900" : "text-slate-600"
                      }`}>
                        {lesson.title}
                      </h4>
                      {lesson.isFree && (
                        <Badge variant="secondary" className="text-xs" aria-label="Free preview available">
                          Free
                        </Badge>
                      )}
                      {lesson.type === "QUIZ" && (
                        <Badge variant="outline" className="text-xs" aria-label="Quiz lesson">
                          Quiz
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm truncate ${
                      isActive ? "text-blue-700" : canAccess ? "text-slate-700" : "text-slate-600"
                    }`}>
                      {lesson.description}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="flex-shrink-0 text-sm text-slate-600" aria-hidden="true">
                    {durationMinutes}:{durationSeconds.toString().padStart(2, '0')}
                  </div>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}