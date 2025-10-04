"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  TrendingUp,
  Users,
  Clock,
  Target,
  Award,
  AlertCircle,
} from "lucide-react"
import { QuizAttempt, Quiz, QuizQuestion } from "@/lib/types/quiz"

interface QuizAnalyticsProps {
  quiz: Quiz
  attempts: QuizAttempt[]
}

interface QuestionStats {
  question: QuizQuestion
  totalAttempts: number
  correctCount: number
  incorrectCount: number
  averageTime: number
  accuracy: number
}

export function QuizAnalytics({ quiz, attempts }: QuizAnalyticsProps) {
  // Calculate overall statistics
  const totalAttempts = attempts.length
  const passedAttempts = attempts.filter((a) => a.passed).length
  const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0

  const averageScore =
    totalAttempts > 0
      ? attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts
      : 0

  const averageTime =
    totalAttempts > 0
      ? attempts.reduce((sum, a) => sum + a.timeSpent, 0) / totalAttempts
      : 0

  // Get unique students
  const uniqueStudents = new Set(attempts.map((a) => a.userId)).size

  // Calculate question-level statistics
  const questionStats: QuestionStats[] = quiz.questions.map((question) => {
    const questionAttempts = attempts.flatMap((attempt) =>
      attempt.answers.filter((ans) => ans.questionId === question.id)
    )

    const totalAttempts = questionAttempts.length
    const correctCount = questionAttempts.filter((ans) => ans.isCorrect).length
    const incorrectCount = totalAttempts - correctCount
    const averageTime =
      totalAttempts > 0
        ? questionAttempts.reduce((sum, ans) => sum + ans.timeSpent, 0) /
          totalAttempts
        : 0
    const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0

    return {
      question,
      totalAttempts,
      correctCount,
      incorrectCount,
      averageTime,
      accuracy,
    }
  })

  // Find most challenging questions (lowest accuracy)
  const challengingQuestions = [...questionStats]
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)

  // Find fastest and slowest questions
  const slowestQuestions = [...questionStats]
    .sort((a, b) => b.averageTime - a.averageTime)
    .slice(0, 3)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 75) return "text-green-600 bg-green-100"
    if (accuracy >= 50) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <CardDescription>Total Attempts</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAttempts}</div>
            <p className="text-sm text-gray-600 mt-1">
              {uniqueStudents} unique students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-600" />
              <CardDescription>Pass Rate</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{passRate.toFixed(1)}%</div>
            <Progress value={passRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <CardDescription>Average Score</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageScore.toFixed(1)}%</div>
            <p className="text-sm text-gray-600 mt-1">
              Passing score: {quiz.passingScore}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <CardDescription>Avg. Time</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatTime(averageTime)}</div>
            {quiz.timeLimit && (
              <p className="text-sm text-gray-600 mt-1">
                Limit: {quiz.timeLimit} minutes
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-blue-600" />
            <CardTitle>Score Distribution</CardTitle>
          </div>
          <CardDescription>
            How students are performing on this quiz
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalAttempts > 0 ? (
            <div className="space-y-3">
              {[
                { range: "90-100%", color: "bg-green-500" },
                { range: "80-89%", color: "bg-blue-500" },
                { range: "70-79%", color: "bg-yellow-500" },
                { range: "60-69%", color: "bg-orange-500" },
                { range: "0-59%", color: "bg-red-500" },
              ].map(({ range, color }) => {
                const [min, max] = range.split("-").map((s) => parseInt(s))
                const count = attempts.filter(
                  (a) => a.score >= min && a.score <= max
                ).length
                const percentage = (count / totalAttempts) * 100

                return (
                  <div key={range} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{range}</span>
                      <span className="text-gray-600">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${color} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No attempts yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <CardTitle>Question Performance</CardTitle>
          </div>
          <CardDescription>
            Detailed statistics for each question
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questionStats.length > 0 ? (
            <div className="space-y-3">
              {questionStats.map((stat, index) => (
                <div
                  key={stat.question.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          Q{index + 1}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getAccuracyColor(stat.accuracy)}`}
                        >
                          {stat.accuracy.toFixed(0)}% accuracy
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {stat.question.question}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Attempts</p>
                      <p className="font-medium">{stat.totalAttempts}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Correct/Incorrect</p>
                      <p className="font-medium">
                        <span className="text-green-600">
                          {stat.correctCount}
                        </span>
                        {" / "}
                        <span className="text-red-600">
                          {stat.incorrectCount}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg. Time</p>
                      <p className="font-medium">{formatTime(stat.averageTime)}</p>
                    </div>
                  </div>

                  <Progress value={stat.accuracy} className="h-1" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No question data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Challenging Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <CardTitle>Most Challenging</CardTitle>
            </div>
            <CardDescription>
              Questions with the lowest accuracy rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {challengingQuestions.length > 0 ? (
              <div className="space-y-3">
                {challengingQuestions.map((stat, index) => (
                  <div key={stat.question.id} className="flex items-start gap-3">
                    <Badge variant="destructive" className="mt-0.5">
                      {index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {stat.question.question}
                      </p>
                      <p className="text-xs text-red-600">
                        {stat.accuracy.toFixed(0)}% accuracy
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Not enough data to determine challenging questions
              </p>
            )}
          </CardContent>
        </Card>

        {/* Time-Consuming Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <CardTitle>Time-Consuming</CardTitle>
            </div>
            <CardDescription>
              Questions that take the longest to answer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {slowestQuestions.length > 0 ? (
              <div className="space-y-3">
                {slowestQuestions.map((stat, index) => (
                  <div key={stat.question.id} className="flex items-start gap-3">
                    <Badge variant="secondary" className="mt-0.5">
                      {index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {stat.question.question}
                      </p>
                      <p className="text-xs text-orange-600">
                        Avg. {formatTime(stat.averageTime)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Not enough data to determine time-consuming questions
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
