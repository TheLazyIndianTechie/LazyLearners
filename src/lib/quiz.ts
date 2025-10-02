import { prisma } from "@/lib/prisma"
import { Quiz, QuizAttempt, QuizAnswer, QuizResult } from "@/lib/types/quiz"

export async function getQuizByLessonId(lessonId: string): Promise<Quiz | null> {
  try {
    const quiz = await prisma.quiz.findFirst({
      where: { lessonId },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return quiz
  } catch (error) {
    console.error("Error fetching quiz:", error)
    return null
  }
}

export async function getQuizById(quizId: string): Promise<Quiz | null> {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return quiz
  } catch (error) {
    console.error("Error fetching quiz:", error)
    return null
  }
}

export async function getUserQuizAttempts(
  userId: string,
  quizId: string
): Promise<QuizAttempt[]> {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        quizId
      },
      orderBy: { startedAt: 'desc' }
    })

    return attempts
  } catch (error) {
    console.error("Error fetching quiz attempts:", error)
    return []
  }
}

export async function getLatestQuizAttempt(
  userId: string,
  quizId: string
): Promise<QuizAttempt | null> {
  try {
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        userId,
        quizId
      },
      orderBy: { startedAt: 'desc' }
    })

    return attempt
  } catch (error) {
    console.error("Error fetching latest quiz attempt:", error)
    return null
  }
}

export async function submitQuizAttempt(
  userId: string,
  quizId: string,
  answers: QuizAnswer[],
  timeSpent: number
): Promise<QuizResult | null> {
  try {
    const quiz = await getQuizById(quizId)
    if (!quiz) {
      throw new Error("Quiz not found")
    }

    // Calculate score
    const totalQuestions = quiz.questions.length
    const correctAnswers = answers.filter(answer => answer.isCorrect).length
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    const passed = score >= quiz.passingScore

    // Create quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        answers: JSON.stringify(answers),
        score,
        passed,
        timeSpent,
        startedAt: new Date(Date.now() - timeSpent * 1000),
        completedAt: new Date()
      }
    })

    // Update lesson progress if passed
    if (passed) {
      await prisma.progress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId: quiz.lessonId
          }
        },
        update: {
          completed: true,
          completedAt: new Date(),
          lastWatched: new Date()
        },
        create: {
          userId,
          lessonId: quiz.lessonId,
          progress: 100,
          timeSpent: 0,
          completed: true,
          completedAt: new Date(),
          lastWatched: new Date()
        }
      })
    }

    const result: QuizResult = {
      attempt: {
        ...attempt,
        answers
      },
      totalQuestions,
      correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      percentage: score,
      passed,
      feedback: generateFeedback(score, quiz.passingScore)
    }

    return result
  } catch (error) {
    console.error("Error submitting quiz attempt:", error)
    return null
  }
}

export async function canUserTakeQuiz(
  userId: string,
  quizId: string
): Promise<{ canTake: boolean; reason?: string; attemptsLeft?: number }> {
  try {
    const quiz = await getQuizById(quizId)
    if (!quiz) {
      return { canTake: false, reason: "Quiz not found" }
    }

    const attempts = await getUserQuizAttempts(userId, quizId)
    const passedAttempts = attempts.filter(attempt => attempt.passed)

    // If user has already passed, they can't retake (unless it's a practice quiz)
    if (passedAttempts.length > 0) {
      return { canTake: false, reason: "Quiz already passed" }
    }

    // Check attempt limit
    if (quiz.attempts > 0 && attempts.length >= quiz.attempts) {
      return { canTake: false, reason: "Maximum attempts reached" }
    }

    const attemptsLeft = quiz.attempts > 0 ? quiz.attempts - attempts.length : -1

    return { canTake: true, attemptsLeft }
  } catch (error) {
    console.error("Error checking quiz eligibility:", error)
    return { canTake: false, reason: "Error checking eligibility" }
  }
}

export function calculateQuizGrade(score: number): {
  letter: string
  color: string
  description: string
} {
  if (score >= 95) {
    return { letter: "A+", color: "text-green-600", description: "Outstanding" }
  } else if (score >= 90) {
    return { letter: "A", color: "text-green-600", description: "Excellent" }
  } else if (score >= 85) {
    return { letter: "B+", color: "text-blue-600", description: "Very Good" }
  } else if (score >= 80) {
    return { letter: "B", color: "text-blue-600", description: "Good" }
  } else if (score >= 75) {
    return { letter: "C+", color: "text-yellow-600", description: "Satisfactory" }
  } else if (score >= 70) {
    return { letter: "C", color: "text-yellow-600", description: "Acceptable" }
  } else if (score >= 65) {
    return { letter: "D+", color: "text-orange-600", description: "Below Average" }
  } else if (score >= 60) {
    return { letter: "D", color: "text-orange-600", description: "Poor" }
  } else {
    return { letter: "F", color: "text-red-600", description: "Failing" }
  }
}

function generateFeedback(score: number, passingScore: number): string {
  if (score >= 95) {
    return "Outstanding performance! You've demonstrated exceptional mastery of the material."
  } else if (score >= 85) {
    return "Excellent work! You have a strong understanding of the concepts."
  } else if (score >= 75) {
    return "Good job! You're showing solid progress in your learning."
  } else if (score >= passingScore) {
    return "Well done! You've met the requirements to pass this assessment."
  } else if (score >= passingScore - 10) {
    return "You're very close to passing! Review the material and try again."
  } else {
    return "Keep studying and don't give up! Consider reviewing the course material before your next attempt."
  }
}

export function formatQuizDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`
    }
  }
}

export function validateQuizAnswers(
  answers: QuizAnswer[],
  questions: any[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check if all questions are answered
  const answeredQuestionIds = new Set(answers.map(a => a.questionId))
  const requiredQuestionIds = new Set(questions.map(q => q.id))

  for (const questionId of requiredQuestionIds) {
    if (!answeredQuestionIds.has(questionId)) {
      errors.push(`Question ${questionId} is not answered`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}