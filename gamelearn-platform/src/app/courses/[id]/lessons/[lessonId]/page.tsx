"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { SiteLayout } from "@/components/layout/site-layout"
import { SimpleVideoPlayer } from "@/components/video/simple-video-player"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  PlayCircle,
  FileText,
  Download
} from "lucide-react"

interface Lesson {
  id: string
  title: string
  description: string
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT'
  content: string
  order: number
  duration: number
  videoUrl?: string
  completed?: boolean
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  description: string
  instructor: {
    id: string
    name: string
    image?: string
  }
  modules: Module[]
}

export default function LessonPage() {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const lessonId = params.lessonId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [currentModule, setCurrentModule] = useState<Module | null>(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourseAndLesson()
  }, [courseId, lessonId])

  const fetchCourseAndLesson = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`)
      if (response.ok) {
        const data = await response.json()
        const courseData = data.course
        setCourse(courseData)

        // Find the current lesson and module
        for (const module of courseData.modules) {
          const lesson = module.lessons.find((l: Lesson) => l.id === lessonId)
          if (lesson) {
            setCurrentLesson(lesson)
            setCurrentModule(module)
            break
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch course and lesson:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoProgress = async (progressPercent: number) => {
    setProgress(progressPercent)

    // Save progress to backend
    if (user?.id && progressPercent > 80) {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId,
            lessonId,
            completionPercentage: progressPercent,
            completed: progressPercent >= 90,
          }),
        })
      } catch (error) {
        console.error('Failed to save progress:', error)
      }
    }
  }

  const handleVideoEnd = async () => {
    // Mark lesson as completed
    if (user?.id) {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId,
            lessonId,
            completionPercentage: 100,
            completed: true,
          }),
        })

        // Update local state
        if (currentLesson) {
          setCurrentLesson({ ...currentLesson, completed: true })
        }
      } catch (error) {
        console.error('Failed to mark lesson as completed:', error)
      }
    }
  }

  const getNextLesson = () => {
    if (!course || !currentModule || !currentLesson) return null

    const currentModuleIndex = course.modules.findIndex(m => m.id === currentModule.id)
    const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id)

    // Try next lesson in same module
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      return currentModule.lessons[currentLessonIndex + 1]
    }

    // Try first lesson of next module
    if (currentModuleIndex < course.modules.length - 1) {
      const nextModule = course.modules[currentModuleIndex + 1]
      return nextModule.lessons[0] || null
    }

    return null
  }

  const getPreviousLesson = () => {
    if (!course || !currentModule || !currentLesson) return null

    const currentModuleIndex = course.modules.findIndex(m => m.id === currentModule.id)
    const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id)

    // Try previous lesson in same module
    if (currentLessonIndex > 0) {
      return currentModule.lessons[currentLessonIndex - 1]
    }

    // Try last lesson of previous module
    if (currentModuleIndex > 0) {
      const previousModule = course.modules[currentModuleIndex - 1]
      return previousModule.lessons[previousModule.lessons.length - 1] || null
    }

    return null
  }

  const nextLesson = getNextLesson()
  const previousLesson = getPreviousLesson()

  if (loading) {
    return (
      <SiteLayout>
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading lesson...</p>
            </div>
          </div>
        </div>
      </SiteLayout>
    )
  }

  if (!course || !currentLesson || !currentModule) {
    return (
      <SiteLayout>
        <div className="container py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Lesson Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The lesson you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button asChild>
              <Link href="/courses">Back to Courses</Link>
            </Button>
          </div>
        </div>
      </SiteLayout>
    )
  }

  return (
    <SiteLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/courses/${courseId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Link>
            </Button>
            <div className="ml-4 flex-1">
              <h1 className="text-lg font-semibold truncate">{course.title}</h1>
            </div>
          </div>
        </div>

        <div className="container py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              {currentLesson.type === 'VIDEO' && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <SimpleVideoPlayer
                    videoId={currentLesson.videoUrl || `sample-${courseId}-${lessonId}`}
                    title={currentLesson.title}
                    lessonId={lessonId}
                    courseId={courseId}
                    onProgress={handleVideoProgress}
                    onEnded={handleVideoEnd}
                    className="w-full h-full"
                  />
                </div>
              )}

              {/* Lesson Content */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{currentModule.title}</Badge>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">Lesson {currentLesson.order}</span>
                  </div>
                  <CardTitle className="text-2xl">{currentLesson.title}</CardTitle>
                  <CardDescription className="text-base">
                    {currentLesson.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {Math.ceil(currentLesson.duration / 60)} min
                    </div>
                    {currentLesson.type === 'VIDEO' && (
                      <div className="flex items-center gap-1">
                        <PlayCircle className="h-4 w-4" />
                        Video Lesson
                      </div>
                    )}
                    {currentLesson.completed && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Completed
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Lesson Content */}
                  {currentLesson.content && (
                    <div className="prose max-w-none">
                      <div dangerouslySetInnerHTML={{
                        __html: currentLesson.content.replace(/\n/g, '<br>')
                      }} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button variant="outline" disabled={!previousLesson} asChild={!!previousLesson}>
                  {previousLesson ? (
                    <Link href={`/courses/${courseId}/lessons/${previousLesson.id}`}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous Lesson
                    </Link>
                  ) : (
                    <span>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous Lesson
                    </span>
                  )}
                </Button>

                <Button disabled={!nextLesson} asChild={!!nextLesson}>
                  {nextLesson ? (
                    <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`}>
                      Next Lesson
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  ) : (
                    <span>
                      Next Lesson
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Instructor Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Instructor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={course.instructor.image} alt={course.instructor.name} />
                      <AvatarFallback>
                        {course.instructor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{course.instructor.name}</p>
                      <p className="text-sm text-muted-foreground">Course Instructor</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Module Navigation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.modules.map((module) => (
                    <div key={module.id} className="space-y-2">
                      <h4 className="font-medium text-sm">{module.title}</h4>
                      <div className="space-y-1">
                        {module.lessons.map((lesson) => (
                          <Link
                            key={lesson.id}
                            href={`/courses/${courseId}/lessons/${lesson.id}`}
                            className={`flex items-center gap-2 p-2 rounded text-sm hover:bg-muted transition-colors ${
                              lesson.id === lessonId ? 'bg-muted border border-border' : ''
                            }`}
                          >
                            <div className="flex-shrink-0">
                              {lesson.completed ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : lesson.type === 'VIDEO' ? (
                                <PlayCircle className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <span className="flex-1 truncate">{lesson.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {Math.ceil(lesson.duration / 60)}m
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}