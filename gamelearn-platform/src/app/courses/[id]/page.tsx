"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { SiteLayout } from "@/components/layout/site-layout"
import { SimpleVideoPlayer } from "@/components/video/simple-video-player"
import { QuizCard } from "@/components/quiz/quiz-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Play,
  Clock,
  Users,
  Star,
  CheckCircle,
  Lock,
  Download,
  Share,
  Heart,
  BookOpen,
  Award,
  Target
} from "lucide-react"
import { Quiz } from "@/lib/types/quiz"

// Mock course data - replace with real API call
const mockCourse = {
  id: "1",
  title: "Complete Unity Game Development Course",
  description: "Learn Unity from scratch and build 10 complete games. Master C# programming, game physics, UI design, and publishing to multiple platforms.",
  thumbnail: "/api/placeholder/800/450",
  instructor: {
    id: "inst-1",
    name: "Alex Johnson",
    email: "alex@gamelearn.com",
    avatar: "/api/placeholder/80/80",
    bio: "Senior Unity developer with 10+ years of experience in the gaming industry. Published over 15 successful mobile games.",
    role: "instructor" as const,
    enrolledCourses: [],
    createdCourses: ["1"],
    portfolio: {} as any,
    certifications: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  category: "unity-development" as const,
  engine: "unity" as const,
  difficulty: "beginner" as const,
  duration: 2400, // 40 hours
  price: 89.99,
  rating: 4.8,
  reviewCount: 1250,
  enrollmentCount: 15420,
  requirements: ["Basic computer skills", "Windows or Mac computer", "Unity 2022.3 LTS (free)"],
  objectives: [
    "Master Unity interface and workflow",
    "Build 10 complete games from scratch",
    "Learn C# programming for game development",
    "Implement game physics and collision detection",
    "Create professional UI and menus",
    "Publish games to multiple platforms",
    "Understand game monetization strategies"
  ],
  tags: ["Unity", "C#", "Game Development", "Beginner", "Mobile Games"],
  modules: [
    {
      id: "mod-1",
      title: "Unity Fundamentals",
      description: "Learn the Unity interface, scene hierarchy, and basic concepts",
      order: 1,
      duration: 480,
      lessons: [
        {
          id: "lesson-1",
          title: "Introduction to Unity",
          description: "Overview of Unity and its capabilities",
          type: "VIDEO" as const,
          order: 1,
          duration: 30,
          videoUrl: "https://www.youtube.com/watch?v=XtQMytORBmM",
          isCompleted: true,
          isFree: true
        },
        {
          id: "lesson-2",
          title: "Unity Interface Tour",
          description: "Navigate the Unity editor like a pro",
          type: "VIDEO" as const,
          order: 2,
          duration: 45,
          videoUrl: "https://www.youtube.com/watch?v=IlKaB1etrik",
          isCompleted: false,
          isFree: true
        },
        {
          id: "lesson-3",
          title: "Creating Your First Scene",
          description: "Hands-on scene creation and object placement",
          type: "VIDEO" as const,
          order: 3,
          duration: 60,
          videoUrl: "https://www.youtube.com/watch?v=gB1F9G0JXOo",
          isCompleted: false,
          isFree: false
        }
      ]
    },
    {
      id: "mod-2",
      title: "C# Programming Basics",
      description: "Learn C# programming fundamentals for game development",
      order: 2,
      duration: 600,
      lessons: [
        {
          id: "lesson-4",
          title: "Variables and Data Types",
          description: "Understanding C# basics for Unity",
          type: "VIDEO" as const,
          order: 1,
          duration: 60,
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
          isCompleted: false,
          isFree: false
        },
        {
          id: "lesson-5",
          title: "Functions and Methods",
          description: "Creating reusable code with functions",
          type: "VIDEO" as const,
          order: 2,
          duration: 75,
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
          isCompleted: false,
          isFree: false
        }
      ]
    }
  ],
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date()
}

// Mock quiz data - replace with real API call
const mockQuizzes: Quiz[] = [
  {
    id: "quiz-1",
    title: "Unity Fundamentals Quiz",
    description: "Test your knowledge of Unity basics and interface",
    lessonId: "lesson-3",
    passingScore: 70,
    timeLimit: 15,
    attempts: 3,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    questions: [
      {
        id: "q1",
        type: "MULTIPLE_CHOICE",
        question: "What is the main camera used for in Unity?",
        options: [
          "Lighting the scene",
          "Rendering what the player sees",
          "Managing audio",
          "Controlling physics"
        ],
        correctAnswer: 1,
        explanation: "The main camera renders what the player sees in the game world.",
        points: 10,
        order: 1
      },
      {
        id: "q2",
        type: "TRUE_FALSE",
        question: "GameObjects are the fundamental objects in Unity scenes.",
        correctAnswer: true,
        explanation: "GameObjects are indeed the fundamental building blocks of Unity scenes.",
        points: 10,
        order: 2
      },
      {
        id: "q3",
        type: "MULTIPLE_CHOICE",
        question: "Which window shows the hierarchical structure of objects in a scene?",
        options: [
          "Inspector",
          "Project",
          "Hierarchy",
          "Scene"
        ],
        correctAnswer: 2,
        explanation: "The Hierarchy window shows the hierarchical structure of GameObjects in the current scene.",
        points: 10,
        order: 3
      }
    ]
  },
  {
    id: "quiz-2",
    title: "C# Programming Basics Quiz",
    description: "Assess your understanding of C# fundamentals for Unity",
    lessonId: "lesson-5",
    passingScore: 75,
    timeLimit: 20,
    attempts: 2,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    questions: [
      {
        id: "q4",
        type: "MULTIPLE_CHOICE",
        question: "Which keyword is used to declare a variable in C#?",
        options: [
          "var",
          "let",
          "int",
          "All of the above"
        ],
        correctAnswer: 3,
        explanation: "In C#, you can use 'var' for type inference, or specific type keywords like 'int', 'string', etc.",
        points: 15,
        order: 1
      },
      {
        id: "q5",
        type: "SHORT_ANSWER",
        question: "What does 'public' mean when used before a variable or method in C#?",
        correctAnswer: "accessible from other classes",
        explanation: "The 'public' access modifier makes members accessible from other classes and assemblies.",
        points: 15,
        order: 2
      }
    ]
  }
]

interface CoursePageProps {
  params: { id: string }
}

export default function CoursePage({ params }: CoursePageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [currentLesson, setCurrentLesson] = useState(mockCourse.modules[0].lessons[0])
  const [progress, setProgress] = useState(15) // Mock progress

  // Check if user is enrolled (mock logic)
  useEffect(() => {
    if (session) {
      setIsEnrolled(true) // Mock enrollment check
    }
  }, [session])

  const handleEnroll = async () => {
    if (!session) {
      router.push("/auth/signin")
      return
    }

    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: mockCourse.id
        }),
      })

      if (response.ok) {
        setIsEnrolled(true)
        // Show success message
        console.log('Successfully enrolled in course')
      } else {
        console.error('Failed to enroll in course')
      }
    } catch (error) {
      console.error('Enrollment error:', error)
    }
  }

  const handleLessonSelect = (lesson: typeof currentLesson) => {
    if (!isEnrolled && !lesson.isFree) {
      return
    }
    setCurrentLesson(lesson)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <SiteLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Video Player Section */}
        <div className="bg-black">
          <div className="container py-6">
            <div className="aspect-video rounded-lg overflow-hidden">
              <SimpleVideoPlayer
                url={currentLesson.videoUrl}
                title={currentLesson.title}
                lessonId={currentLesson.id}
                courseId={params.id}
                onProgress={(progress) => {
                  console.log("Video progress:", progress)
                }}
                onEnded={() => {
                  console.log("Lesson completed:", currentLesson.id)
                }}
              />
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Header */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={mockCourse.instructor.avatar} alt={mockCourse.instructor.name} />
                    <AvatarFallback>
                      {mockCourse.instructor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{mockCourse.title}</h1>
                    <p className="text-gray-600 mb-3">{mockCourse.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>By {mockCourse.instructor.name}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span>{mockCourse.rating}</span>
                        <span>({mockCourse.reviewCount.toLocaleString()} reviews)</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{mockCourse.enrollmentCount.toLocaleString()} students</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-black text-white">Unity</Badge>
                  <Badge variant="outline">Beginner</Badge>
                  <Badge variant="outline">{formatDuration(mockCourse.duration)}</Badge>
                  <Badge variant="outline">Certificate</Badge>
                </div>

                {isEnrolled && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-blue-700">Course Progress</span>
                      <span className="text-sm text-blue-600">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>

              {/* Course Content Tabs */}
              <Tabs defaultValue="curriculum" className="bg-white rounded-lg shadow-sm">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
                  <TabsTrigger value="curriculum" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
                    Curriculum
                  </TabsTrigger>
                  <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="instructor" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
                    Instructor
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
                    Reviews
                  </TabsTrigger>
                  <TabsTrigger value="assessments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
                    Assessments
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="curriculum" className="p-6">
                  <div className="space-y-4">
                    {mockCourse.modules.map((module) => (
                      <Card key={module.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{module.title}</span>
                            <Badge variant="outline">{formatDuration(module.duration)}</Badge>
                          </CardTitle>
                          <CardDescription>{module.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {module.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                  currentLesson.id === lesson.id
                                    ? 'bg-blue-50 border border-blue-200'
                                    : 'hover:bg-gray-50'
                                } ${!isEnrolled && !lesson.isFree ? 'opacity-50' : ''}`}
                                onClick={() => handleLessonSelect(lesson)}
                              >
                                <div className="flex-shrink-0">
                                  {lesson.isCompleted ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : !isEnrolled && !lesson.isFree ? (
                                    <Lock className="w-5 h-5 text-gray-400" />
                                  ) : (
                                    <Play className="w-5 h-5 text-blue-500" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{lesson.title}</span>
                                    {lesson.isFree && <Badge variant="secondary" className="text-xs">Free</Badge>}
                                  </div>
                                  <p className="text-sm text-gray-600">{lesson.description}</p>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Clock className="w-4 h-4" />
                                  <span>{lesson.duration}m</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="overview" className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-500" />
                        What you'll learn
                      </h3>
                      <ul className="space-y-2">
                        {mockCourse.objectives.map((objective, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        Requirements
                      </h3>
                      <ul className="space-y-2">
                        {mockCourse.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="instructor" className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={mockCourse.instructor.avatar} alt={mockCourse.instructor.name} />
                      <AvatarFallback>
                        {mockCourse.instructor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">{mockCourse.instructor.name}</h3>
                      <p className="text-gray-600 mb-3">{mockCourse.instructor.bio}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>4.9 Instructor Rating</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          <span>25 Courses</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>50K+ Students</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="p-6">
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Reviews section coming soon!</p>
                  </div>
                </TabsContent>

                <TabsContent value="assessments" className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">Course Assessments</h3>
                    </div>

                    {mockQuizzes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No assessments available for this course yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {mockQuizzes.map((quiz) => (
                          <QuizCard
                            key={quiz.id}
                            quiz={quiz}
                            canTake={isEnrolled}
                            reason={!isEnrolled ? "Please enroll to take assessments" : undefined}
                          />
                        ))}
                      </div>
                    )}

                    {!isEnrolled && (
                      <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                        <Award className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-blue-800 font-medium mb-2">Unlock Course Assessments</p>
                        <p className="text-blue-600 text-sm mb-4">
                          Enroll in this course to access quizzes, assignments, and earn certificates.
                        </p>
                        <Button
                          onClick={handleEnroll}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Enroll Now
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Purchase Card */}
              <Card className="sticky top-6">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {mockCourse.price === 0 ? "Free" : `$${mockCourse.price}`}
                    </div>
                    {mockCourse.price > 0 && (
                      <div className="text-sm text-gray-500 line-through">
                        $149.99
                      </div>
                    )}
                  </div>

                  {!isEnrolled ? (
                    <Button
                      onClick={handleEnroll}
                      className="w-full mb-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      size="lg"
                    >
                      Enroll Now
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleLessonSelect(mockCourse.modules[0].lessons[0])}
                      className="w-full mb-4"
                      size="lg"
                    >
                      Continue Learning
                    </Button>
                  )}

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{formatDuration(mockCourse.duration)} on-demand video</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-gray-500" />
                      <span>Downloadable resources</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-gray-500" />
                      <span>Certificate of completion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>Access to community</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t mt-6">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Heart className="w-4 h-4 mr-2" />
                        Wishlist
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Students</span>
                    <span className="font-medium">{mockCourse.enrollmentCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{mockCourse.rating}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{formatDuration(mockCourse.duration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Level</span>
                    <span className="font-medium capitalize">{mockCourse.difficulty}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}