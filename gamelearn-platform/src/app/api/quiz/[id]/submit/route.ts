import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { submitQuizAttempt, canUserTakeQuiz } from "@/lib/quiz"
import { QuizAnswer } from "@/lib/types/quiz"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quizId = params.id
    const { answers, timeSpent } = await request.json()

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid answers format" }, { status: 400 })
    }

    if (!timeSpent || typeof timeSpent !== "number") {
      return NextResponse.json({ error: "Invalid time spent" }, { status: 400 })
    }

    // Check if user can take the quiz
    const eligibility = await canUserTakeQuiz(userId, quizId)
    if (!eligibility.canTake) {
      return NextResponse.json({
        error: "Cannot take quiz",
        reason: eligibility.reason
      }, { status: 403 })
    }

    // Submit the quiz attempt
    const result = await submitQuizAttempt(
      userId,
      quizId,
      answers as QuizAnswer[],
      timeSpent
    )

    if (!result) {
      return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error submitting quiz:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}