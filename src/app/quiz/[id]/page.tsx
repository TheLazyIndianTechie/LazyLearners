"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { SiteLayout } from "@/components/layout/site-layout"
import { QuizPlayer } from "@/components/quiz/quiz-player"
import { QuizResults } from "@/components/quiz/quiz-results"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { useQuiz } from "@/hooks/use-quiz"
import { QuizAnswer, QuizResult, QuizStatus } from "@/lib/types/quiz"

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string

  const {
    quiz,
    eligibility,
    attempts,
    loading,
    submitting,
    error,
    submitQuiz,
    hasPassedQuiz,
    getRemainingAttempts
  } = useQuiz(quizId)

  const [quizStatus, setQuizStatus] = useState<QuizStatus>("NOT_STARTED")
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [showDetailedReview, setShowDetailedReview] = useState(false)

  const handleQuizComplete = async (answers: QuizAnswer[], timeSpent: number) => {
    const result = await submitQuiz(quizId, answers, timeSpent)
    if (result) {
      setQuizResult(result)
      setQuizStatus("COMPLETED")
    }
  }

  const handleRetry = () => {
    setQuizStatus("NOT_STARTED")
    setQuizResult(null)
    setShowDetailedReview(false)
  }

  const handleContinue = () => {
    // Navigate back to course or lesson
    router.back()
  }

  const handleReviewAnswers = () => {
    setShowDetailedReview(true)
  }

  const handleExitQuiz = () => {
    if (quizStatus === "IN_PROGRESS") {
      const confirmExit = window.confirm("Are you sure you want to exit? Your progress will be lost.")
      if (!confirmExit) return
    }
    router.back()
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading quiz...</p>
            </div>
          </div>
        </div>
      </SiteLayout>
    )
  }

  if (error || !quiz) {
    return (
      <SiteLayout>
        <div className="container py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Error Loading Quiz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {error || "Quiz not found or unable to load."}
              </p>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    )
  }

  if (eligibility && !eligibility.canTake) {
    return (
      <SiteLayout>
        <div className="container py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Quiz Access Restricted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  {eligibility.reason === "Quiz already passed" && "Congratulations! You have already passed this quiz."}
                  {eligibility.reason === "Maximum attempts reached" && "You have reached the maximum number of attempts for this quiz."}
                  {eligibility.reason && !["Quiz already passed", "Maximum attempts reached"].includes(eligibility.reason) && eligibility.reason}
                </p>

                {hasPassedQuiz() && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600">PASSED</Badge>
                      <span className="text-green-800">Quiz completed successfully!</span>
                    </div>
                  </div>
                )}

                {attempts.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Your Previous Attempts:</h4>
                    <div className="space-y-2">
                      {attempts.map((attempt, index) => (
                        <div
                          key={attempt.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                        >
                          <div>
                            <span className="font-medium">Attempt {attempts.length - index}</span>
                            <span className="text-gray-600 ml-2">
                              {new Date(attempt.startedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={attempt.passed ? "default" : "destructive"}>
                              {attempt.score}%
                            </Badge>
                            {attempt.passed && <Badge className="bg-green-600">PASSED</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    )
  }

  return (
    <SiteLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>

          {quizStatus !== "NOT_STARTED" && (
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{quiz.title}</h1>
              {getRemainingAttempts() > 0 && (
                <Badge variant="outline">
                  {getRemainingAttempts()} attempts remaining
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Quiz Content */}
        {quizStatus === "COMPLETED" && quizResult ? (
          <QuizResults
            quiz={quiz}
            result={quizResult}
            onRetry={getRemainingAttempts() > 0 ? handleRetry : undefined}
            onContinue={quizResult.passed ? handleContinue : undefined}
            onReview={handleReviewAnswers}
            showDetailedReview={showDetailedReview}
          />
        ) : (
          <QuizPlayer
            quiz={quiz}
            onComplete={handleQuizComplete}
            onExit={handleExitQuiz}
            status={quizStatus}
          />
        )}
      </div>
    </SiteLayout>
  )
}