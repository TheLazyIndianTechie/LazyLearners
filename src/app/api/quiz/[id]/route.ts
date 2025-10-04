import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { getQuizById, canUserTakeQuiz } from "@/lib/quiz"
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

const UpdateQuizSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  questions: z.array(QuizQuestionSchema).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  timeLimit: z.number().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quizId = params.id
    const quiz = await getQuizById(quizId)

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Check if user is instructor - if so, return full quiz with answers
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (user?.role === "INSTRUCTOR") {
      return NextResponse.json({ quiz })
    }

    // Check if user can take the quiz
    const eligibility = await canUserTakeQuiz(userId, quizId)

    // Remove correct answers from questions for security
    const sanitizedQuiz = {
      ...quiz,
      questions: quiz.questions.map(question => ({
        ...question,
        correctAnswer: undefined, // Hide correct answer
        explanation: undefined    // Hide explanation until after submission
      }))
    }

    return NextResponse.json({
      quiz: sanitizedQuiz,
      eligibility
    })
  } catch (error) {
    console.error("Error fetching quiz:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/quiz/[id] - Update quiz (instructors only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: "Only instructors can update quizzes" },
        { status: 403 }
      )
    }

    // Check if quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: params.id },
    })

    if (!existingQuiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = UpdateQuizSchema.parse(body)

    // Prepare update data
    const updateData: any = {}

    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title
    }

    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description
    }

    if (validatedData.questions !== undefined) {
      updateData.questions = JSON.stringify(validatedData.questions)
    }

    if (validatedData.passingScore !== undefined) {
      updateData.passingScore = validatedData.passingScore
    }

    if (validatedData.timeLimit !== undefined) {
      updateData.timeLimit = validatedData.timeLimit
    }

    const quiz = await prisma.quiz.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({
      ...quiz,
      questions: JSON.parse(quiz.questions),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating quiz:", error)
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 }
    )
  }
}

// DELETE /api/quiz/[id] - Delete quiz (instructors only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: "Only instructors can delete quizzes" },
        { status: 403 }
      )
    }

    // Check if quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: params.id },
    })

    if (!existingQuiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    await prisma.quiz.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Quiz deleted successfully" })
  } catch (error) {
    console.error("Error deleting quiz:", error)
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    )
  }
}