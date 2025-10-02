import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

import { getQuizById, canUserTakeQuiz } from "@/lib/quiz"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quizId = params.id
    const quiz = await getQuizById(quizId)

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
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