import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

const QuizQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "CODE_SNIPPET"]),
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.number(), z.boolean()]),
  explanation: z.string().optional(),
  points: z.number().min(1),
  order: z.number(),
})

const CreateQuizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  lessonId: z.string(),
  questions: z.array(QuizQuestionSchema),
  passingScore: z.number().min(0).max(100),
  timeLimit: z.number().optional(),
  isPublished: z.boolean().default(false),
})

// GET /api/quiz?lessonId=xxx
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const lessonId = searchParams.get("lessonId")

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required" },
        { status: 400 }
      )
    }

    const quiz = await prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        attempts: {
          where: { userId },
          orderBy: { completedAt: "desc" },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Parse questions from JSON
    const parsedQuiz = {
      ...quiz,
      questions: JSON.parse(quiz.questions),
      attempts: quiz.attempts.map((attempt) => ({
        ...attempt,
        answers: JSON.parse(attempt.answers),
      })),
    }

    return NextResponse.json(parsedQuiz)
  } catch (error) {
    console.error("Error fetching quiz:", error)
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    )
  }
}

// POST /api/quiz
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an instructor
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || user.role !== "INSTRUCTOR") {
      return NextResponse.json(
        { error: "Only instructors can create quizzes" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = CreateQuizSchema.parse(body)

    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: validatedData.lessonId },
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    // Check if quiz already exists for this lesson
    const existingQuiz = await prisma.quiz.findUnique({
      where: { lessonId: validatedData.lessonId },
    })

    if (existingQuiz) {
      return NextResponse.json(
        { error: "Quiz already exists for this lesson" },
        { status: 400 }
      )
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        lessonId: validatedData.lessonId,
        questions: JSON.stringify(validatedData.questions),
        passingScore: validatedData.passingScore,
        timeLimit: validatedData.timeLimit,
      },
    })

    return NextResponse.json(
      {
        ...quiz,
        questions: JSON.parse(quiz.questions),
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating quiz:", error)
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    )
  }
}
