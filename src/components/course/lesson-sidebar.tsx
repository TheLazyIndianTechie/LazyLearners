"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  CheckCircle2,
  Circle,
  Lock,
  PlayCircle,
  FileText,
  HelpCircle,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Lesson {
  id: string
  title: string
  type: 'VIDEO' | 'TEXT' | 'QUIZ'
  duration: number
  order: number
  videoUrl?: string
}

interface Module {
  id: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
}

interface Progress {
  lessonId: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  completionPercentage?: number
}

interface LessonSidebarProps {
  courseId: string
  modules: Module[]
  currentLessonId?: string
  onLessonSelect: (lessonId: string) => void
  enableSequentialLock?: boolean
  className?: string
}

export function LessonSidebar({
  courseId,
  modules,
  currentLessonId,
  onLessonSelect,
  enableSequentialLock = false,
  className
}: LessonSidebarProps) {
  const [progress, setProgress] = useState<Progress[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<string[]>([])

  useEffect(() => {
    fetchProgress()
  }, [courseId])

  // Auto-expand module containing current lesson
  useEffect(() => {
    if (currentLessonId && modules.length > 0) {
      const moduleWithCurrentLesson = modules.find(module =>
        module.lessons.some(lesson => lesson.id === currentLessonId)
      )

      if (moduleWithCurrentLesson && !expandedModules.includes(moduleWithCurrentLesson.id)) {
        setExpandedModules(prev => [...prev, moduleWithCurrentLesson.id])
      }

      // Scroll to active lesson
      setTimeout(() => {
        const activeElement = document.getElementById(`lesson-${currentLessonId}`)
        if (activeElement) {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [currentLessonId, modules])

  const fetchProgress = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/progress/course/${courseId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch progress')
      }

      const data = await response.json()
      setProgress(data.progress || [])
    } catch (error) {
      console.error('Error fetching progress:', error)
      setProgress([])
    } finally {
      setLoading(false)
    }
  }

  const getLessonProgress = (lessonId: string): Progress | undefined => {
    return progress.find(p => p.lessonId === lessonId)
  }

  const getModuleProgress = (module: Module) => {
    const moduleLessons = module.lessons
    const completedLessons = moduleLessons.filter(lesson => {
      const lessonProgress = getLessonProgress(lesson.id)
      return lessonProgress?.status === 'COMPLETED'
    })

    const completionPercentage = moduleLessons.length > 0
      ? (completedLessons.length / moduleLessons.length) * 100
      : 0

    return {
      completed: completedLessons.length,
      total: moduleLessons.length,
      percentage: completionPercentage
    }
  }

  const isLessonLocked = (lesson: Lesson, moduleId: string): boolean => {
    if (!enableSequentialLock) return false

    const module = modules.find(m => m.id === moduleId)
    if (!module) return true

    const lessonIndex = module.lessons.findIndex(l => l.id === lesson.id)
    if (lessonIndex === 0) return false // First lesson is never locked

    // Check if previous lesson is completed
    const previousLesson = module.lessons[lessonIndex - 1]
    const previousProgress = getLessonProgress(previousLesson.id)

    return previousProgress?.status !== 'COMPLETED'
  }

  const getLessonIcon = (lesson: Lesson) => {
    switch (lesson.type) {
      case 'VIDEO':
        return PlayCircle
      case 'TEXT':
        return FileText
      case 'QUIZ':
        return HelpCircle
      default:
        return Circle
    }
  }

  const getLessonStatusIcon = (lesson: Lesson, moduleId: string) => {
    const lessonProgress = getLessonProgress(lesson.id)
    const isLocked = isLessonLocked(lesson, moduleId)

    if (isLocked) {
      return <Lock className="h-4 w-4 text-muted-foreground" />
    }

    if (lessonProgress?.status === 'COMPLETED') {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }

    if (lessonProgress?.status === 'IN_PROGRESS') {
      return <Circle className="h-4 w-4 text-primary fill-primary/20" />
    }

    return <Circle className="h-4 w-4 text-muted-foreground" />
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Course Progress Summary */}
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold mb-2">Course Progress</h3>
        <div className="space-y-2">
          {modules.map(module => {
            const moduleProgress = getModuleProgress(module)
            return (
              <div key={module.id} className="text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-muted-foreground truncate flex-1">
                    {module.title}
                  </span>
                  <span className="text-xs font-medium ml-2">
                    {moduleProgress.completed}/{moduleProgress.total}
                  </span>
                </div>
                <Progress value={moduleProgress.percentage} className="h-1" />
              </div>
            )
          })}
        </div>
      </div>

      {/* Lessons List */}
      <div className="flex-1 overflow-y-auto">
        <Accordion
          type="multiple"
          value={expandedModules}
          onValueChange={setExpandedModules}
          className="w-full"
        >
          {modules.map((module, moduleIndex) => {
            const moduleProgress = getModuleProgress(module)

            return (
              <AccordionItem key={module.id} value={module.id} className="border-b">
                <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 hover:no-underline">
                  <div className="flex items-start gap-3 w-full text-left">
                    <div className="mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {moduleIndex + 1}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                        {module.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {moduleProgress.completed} of {moduleProgress.total} completed
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="space-y-1">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isActive = lesson.id === currentLessonId
                      const isLocked = isLessonLocked(lesson, module.id)
                      const LessonIcon = getLessonIcon(lesson)
                      const lessonProgress = getLessonProgress(lesson.id)

                      return (
                        <button
                          key={lesson.id}
                          id={`lesson-${lesson.id}`}
                          onClick={() => {
                            if (!isLocked) {
                              onLessonSelect(lesson.id)
                            }
                          }}
                          disabled={isLocked}
                          className={cn(
                            "w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors",
                            "hover:bg-muted/50",
                            isActive && "bg-primary/10 border-l-2 border-primary",
                            isLocked && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="mt-0.5">
                            {getLessonStatusIcon(lesson, module.id)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className={cn(
                                "text-sm font-medium line-clamp-2",
                                isActive && "text-primary"
                              )}>
                                {lessonIndex + 1}. {lesson.title}
                              </h5>
                              <LessonIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {lesson.type}
                              </Badge>
                              {lesson.duration > 0 && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDuration(lesson.duration)}</span>
                                </div>
                              )}
                            </div>
                            {lessonProgress && lessonProgress.completionPercentage > 0 && lessonProgress.completionPercentage < 100 && (
                              <Progress
                                value={lessonProgress.completionPercentage}
                                className="h-1 mt-2"
                              />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>
    </div>
  )
}
