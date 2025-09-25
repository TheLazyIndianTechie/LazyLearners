import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { getUserQuizAttempts } from "@/lib/quiz"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quizId = params.id
    const attempts = await getUserQuizAttempts(userId, quizId)

    // Parse answers JSON for each attempt
    const parsedAttempts = attempts.map(attempt => ({
      ...attempt,
      answers: typeof attempt.answers === 'string'
        ? JSON.parse(attempt.answers)
        : attempt.answers
    }))

    return NextResponse.json(parsedAttempts)
  } catch (error) {
    console.error("Error fetching quiz attempts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}