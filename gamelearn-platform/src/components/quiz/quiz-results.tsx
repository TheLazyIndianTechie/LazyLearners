"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  XCircle,
  Award,
  Clock,
  Target,
  RotateCcw,
  ArrowRight,
  TrendingUp
} from "lucide-react"
import { QuizResult, Quiz, QuizQuestion } from "@/lib/types/quiz"

interface QuizResultsProps {
  quiz: Quiz
  result: QuizResult
  onRetry?: () => void
  onContinue?: () => void
  onReview?: () => void
  showDetailedReview?: boolean
}

export function QuizResults({
  quiz,
  result,
  onRetry,
  onContinue,
  onReview,
  showDetailedReview = false
}: QuizResultsProps) {
  const { attempt, totalQuestions, correctAnswers, percentage, passed } = result

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getPerformanceMessage = () => {
    if (percentage >= 95) return "Outstanding! Perfect performance! 🎉"
    if (percentage >= 85) return "Excellent work! You've mastered this topic! 🌟"
    if (percentage >= 75) return "Great job! You have a solid understanding! 👏"
    if (percentage >= quiz.passingScore) return "Well done! You passed the quiz! ✅"
    return "Keep studying and try again! You can do it! 💪"
  }

  const getGradeColor = () => {
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 80) return "text-blue-600"
    if (percentage >= 70) return "text-yellow-600"
    if (percentage >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const getGradeBg = () => {
    if (percentage >= 90) return "bg-green-50 border-green-200"
    if (percentage >= 80) return "bg-blue-50 border-blue-200"
    if (percentage >= 70) return "bg-yellow-50 border-yellow-200"
    if (percentage >= 60) return "bg-orange-50 border-orange-200"
    return "bg-red-50 border-red-200"
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Results Card */}
      <Card className={`border-2 ${getGradeBg()}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {passed ? (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="w-10 h-10 text-green-600" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            )}
          </div>

          <CardTitle className="text-2xl mb-2">
            {passed ? "Congratulations!" : "Quiz Complete"}
          </CardTitle>

          <div className={`text-4xl font-bold mb-2 ${getGradeColor()}`}>
            {percentage}%
          </div>

          <p className="text-gray-600 mb-4">
            {getPerformanceMessage()}
          </p>

          <div className="flex justify-center">
            <Badge
              variant={passed ? "default" : "destructive"}
              className="text-sm px-4 py-2"
            >
              {passed ? "PASSED" : "FAILED"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>

            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-red-600">{totalQuestions - correctAnswers}</div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>

            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{formatTime(attempt.timeSpent)}</div>
              <div className="text-sm text-gray-600">Time Spent</div>
            </div>

            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">{quiz.passingScore}%</div>
              <div className="text-sm text-gray-600">Required</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-600">{correctAnswers}/{totalQuestions} correct</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            {onReview && (
              <Button variant="outline" onClick={onReview}>
                Review Answers
              </Button>
            )}

            {!passed && onRetry && (
              <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}

            {passed && onContinue && (
              <Button onClick={onContinue} className="bg-green-600 hover:bg-green-700">
                Continue Learning
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      {showDetailedReview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Detailed Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quiz.questions.map((question, index) => {
                const userAnswer = attempt.answers.find(a => a.questionId === question.id)
                const isCorrect = userAnswer?.isCorrect || false

                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      isCorrect
                        ? "bg-green-50 border-l-green-500"
                        : "bg-red-50 border-l-red-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">
                            Question {index + 1}: {question.question}
                          </h4>
                          <Badge variant={isCorrect ? "default" : "destructive"} className="text-xs">
                            {question.points} pts
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Your answer: </span>
                            <span className={isCorrect ? "text-green-700" : "text-red-700"}>
                              {question.type === "MULTIPLE_CHOICE" && question.options
                                ? question.options[Number(userAnswer?.answer)] || "No answer"
                                : String(userAnswer?.answer || "No answer")
                              }
                            </span>
                          </div>

                          {!isCorrect && (
                            <div>
                              <span className="font-medium text-gray-700">Correct answer: </span>
                              <span className="text-green-700">
                                {question.type === "MULTIPLE_CHOICE" && question.options
                                  ? question.options[Number(question.correctAnswer)]
                                  : String(question.correctAnswer)
                                }
                              </span>
                            </div>
                          )}

                          {question.explanation && (
                            <div className="mt-2 p-3 bg-blue-50 rounded border">
                              <span className="font-medium text-blue-800">Explanation: </span>
                              <span className="text-blue-700">{question.explanation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Question Types Performance</h4>
              <div className="space-y-2">
                {["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "CODE_SNIPPET"].map(type => {
                  const typeQuestions = quiz.questions.filter(q => q.type === type)
                  if (typeQuestions.length === 0) return null

                  const typeCorrect = typeQuestions.filter(q =>
                    attempt.answers.find(a => a.questionId === q.id)?.isCorrect
                  ).length

                  const typePercentage = (typeCorrect / typeQuestions.length) * 100

                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm">{type.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {typeCorrect}/{typeQuestions.length}
                        </span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${typePercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Study Recommendations</h4>
              <div className="space-y-2 text-sm">
                {percentage < quiz.passingScore && (
                  <p className="text-orange-700">
                    • Review the course materials and try the quiz again
                  </p>
                )}
                {percentage >= 70 && percentage < 85 && (
                  <p className="text-blue-700">
                    • Good understanding! Focus on the incorrect answers
                  </p>
                )}
                {percentage >= 85 && (
                  <p className="text-green-700">
                    • Excellent work! You're ready to move forward
                  </p>
                )}
                <p className="text-gray-600">
                  • Time spent: {formatTime(attempt.timeSpent)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}