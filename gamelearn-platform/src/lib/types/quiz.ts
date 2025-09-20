export interface QuizQuestion {
  id: string
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "CODE_SNIPPET"
  question: string
  options?: string[]
  correctAnswer: string | number
  explanation?: string
  points: number
  order: number
}

export interface Quiz {
  id: string
  title: string
  description?: string
  lessonId: string
  questions: QuizQuestion[]
  passingScore: number
  timeLimit?: number
  attempts: number
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

export interface QuizAttempt {
  id: string
  quizId: string
  userId: string
  answers: QuizAnswer[]
  score: number
  passed: boolean
  timeSpent: number
  startedAt: Date
  completedAt?: Date
}

export interface QuizAnswer {
  questionId: string
  answer: string | number
  isCorrect: boolean
  timeSpent: number
}

export interface QuizResult {
  attempt: QuizAttempt
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  percentage: number
  passed: boolean
  feedback: string
}

export type QuizStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "PASSED" | "FAILED"