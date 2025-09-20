"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  Target,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  HelpCircle
} from "lucide-react"
import { Quiz, QuizAttempt } from "@/lib/types/quiz"

interface QuizCardProps {
  quiz: Quiz
  attempts?: QuizAttempt[]
  canTake?: boolean
  reason?: string
  className?: string
}

export function QuizCard({
  quiz,
  attempts = [],
  canTake = true,
  reason,
  className = ""
}: QuizCardProps) {
  const latestAttempt = attempts.length > 0 ? attempts[0] : null
  const bestAttempt = attempts.length > 0
    ? attempts.reduce((best, current) => current.score > best.score ? current : best)
    : null
  const hasPassed = attempts.some(attempt => attempt.passed)

  const getStatusColor = () => {
    if (hasPassed) return "text-green-600"
    if (latestAttempt && !latestAttempt.passed) return "text-red-600"
    return "text-gray-600"
  }

  const getStatusIcon = () => {
    if (hasPassed) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (latestAttempt && !latestAttempt.passed) return <XCircle className="w-4 h-4 text-red-600" />
    return <HelpCircle className="w-4 h-4 text-gray-400" />
  }

  const getActionButton = () => {
    if (!canTake) {
      return (
        <Button disabled variant="outline" className="w-full">
          {reason || "Cannot take quiz"}
        </Button>
      )
    }

    if (hasPassed) {
      return (
        <Button asChild variant="outline" className="w-full">
          <Link href={`/quiz/${quiz.id}`}>
            View Results
          </Link>
        </Button>
      )
    }

    if (attempts.length > 0) {
      return (
        <Button asChild className="w-full">
          <Link href={`/quiz/${quiz.id}`}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake Quiz
          </Link>
        </Button>
      )
    }

    return (
      <Button asChild className="w-full">
        <Link href={`/quiz/${quiz.id}`}>
          <Play className="w-4 h-4 mr-2" />
          Start Quiz
        </Link>
      </Button>
    )
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{quiz.title}</CardTitle>
            {quiz.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{quiz.description}</p>
            )}
          </div>
          <div className="flex-shrink-0 ml-3">
            {getStatusIcon()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quiz Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm font-medium text-gray-700">{quiz.questions.length}</div>
            <div className="text-xs text-gray-500">Questions</div>
          </div>

          {quiz.timeLimit && (
            <div>
              <div className="text-sm font-medium text-gray-700">{quiz.timeLimit}m</div>
              <div className="text-xs text-gray-500">Time Limit</div>
            </div>
          )}

          <div>
            <div className="text-sm font-medium text-gray-700">{quiz.passingScore}%</div>
            <div className="text-xs text-gray-500">To Pass</div>
          </div>
        </div>

        {/* Progress/Results */}
        {bestAttempt && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Best Score</span>
              <span className={`font-medium ${getStatusColor()}`}>
                {bestAttempt.score}%
              </span>
            </div>
            <Progress value={bestAttempt.score} className="h-2" />

            {hasPassed && (
              <div className="flex items-center justify-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Passed!</span>
              </div>
            )}
          </div>
        )}

        {/* Attempts Info */}
        {attempts.length > 0 && (
          <div className="text-xs text-gray-500 text-center">
            {attempts.length} {attempts.length === 1 ? 'attempt' : 'attempts'}
            {quiz.attempts > 0 && ` of ${quiz.attempts} allowed`}
          </div>
        )}

        {/* Action Button */}
        {getActionButton()}

        {/* Additional Info */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            <span>{quiz.questions.reduce((sum, q) => sum + q.points, 0)} points</span>
          </div>
          {quiz.timeLimit && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{quiz.timeLimit} min</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}