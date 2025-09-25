"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Quiz, QuizAnswer, QuizResult, QuizAttempt } from "@/lib/types/quiz"

interface QuizEligibility {
  canTake: boolean
  reason?: string
  attemptsLeft?: number
}

export function useQuiz(quizId?: string) {
  const { isSignedIn, user } = useUser()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [eligibility, setEligibility] = useState<QuizEligibility | null>(null)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQuiz = async (id: string) => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/quiz/${id}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch quiz")
      }

      const data = await response.json()
      setQuiz(data.quiz)
      setEligibility(data.eligibility)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch quiz")
    } finally {
      setLoading(false)
    }
  }

  const fetchAttempts = async (id: string) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/quiz/${id}/attempts`)

      if (!response.ok) {
        throw new Error("Failed to fetch attempts")
      }

      const data = await response.json()
      setAttempts(data)
    } catch (err) {
      console.error("Failed to fetch attempts:", err)
    }
  }

  const submitQuiz = async (
    id: string,
    answers: QuizAnswer[],
    timeSpent: number
  ): Promise<QuizResult | null> => {
    if (!user?.id) return null

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/quiz/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers,
          timeSpent,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit quiz")
      }

      const result = await response.json()

      // Refresh attempts after submission
      await fetchAttempts(id)

      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz")
      return null
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (quizId && user?.id) {
      fetchQuiz(quizId)
      fetchAttempts(quizId)
    }
  }, [quizId, user?.id])

  const refetch = () => {
    if (quizId) {
      fetchQuiz(quizId)
      fetchAttempts(quizId)
    }
  }

  const getLatestAttempt = () => {
    return attempts.length > 0 ? attempts[0] : null
  }

  const getBestAttempt = () => {
    if (attempts.length === 0) return null
    return attempts.reduce((best, current) =>
      current.score > best.score ? current : best
    )
  }

  const hasPassedQuiz = () => {
    return attempts.some(attempt => attempt.passed)
  }

  const getRemainingAttempts = () => {
    if (!quiz || quiz.attempts <= 0) return -1 // Unlimited
    return Math.max(0, quiz.attempts - attempts.length)
  }

  return {
    quiz,
    eligibility,
    attempts,
    loading,
    submitting,
    error,
    submitQuiz,
    refetch,
    getLatestAttempt,
    getBestAttempt,
    hasPassedQuiz,
    getRemainingAttempts
  }
}

export function useQuizTimer(timeLimit?: number) {
  const [timeLeft, setTimeLeft] = useState<number | null>(
    timeLimit ? timeLimit * 60 : null
  )
  const [isActive, setIsActive] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time !== null ? time - 1 : null)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft])

  const start = () => {
    setIsActive(true)
    setStartTime(Date.now())
  }

  const pause = () => {
    setIsActive(false)
  }

  const resume = () => {
    setIsActive(true)
  }

  const reset = () => {
    setTimeLeft(timeLimit ? timeLimit * 60 : null)
    setIsActive(false)
    setStartTime(null)
  }

  const getElapsedTime = () => {
    if (!startTime) return 0
    return Math.floor((Date.now() - startTime) / 1000)
  }

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return null

    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return {
    timeLeft,
    isActive,
    start,
    pause,
    resume,
    reset,
    getElapsedTime,
    formatTime: (seconds?: number) => formatTime(seconds ?? timeLeft),
    isExpired: timeLeft === 0
  }
}