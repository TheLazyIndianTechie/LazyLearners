"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Flag,
  RotateCcw
} from "lucide-react"
import { QuizQuestion, QuizAnswer, Quiz, QuizStatus } from "@/lib/types/quiz"

interface QuizPlayerProps {
  quiz: Quiz
  onComplete: (answers: QuizAnswer[], timeSpent: number) => void
  onExit?: () => void
  initialAnswers?: QuizAnswer[]
  status?: QuizStatus
}

export function QuizPlayer({
  quiz,
  onComplete,
  onExit,
  initialAnswers = [],
  status = "NOT_STARTED"
}: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>(
    initialAnswers.reduce((acc, answer) => ({
      ...acc,
      [answer.questionId]: answer.answer
    }), {})
  )
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit ? quiz.timeLimit * 60 : null)
  const [startTime] = useState(Date.now())
  const [questionStartTimes, setQuestionStartTimes] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const timerRef = useRef<NodeJS.Timeout>()

  const currentQuestion = quiz.questions[currentQuestionIndex]

  useEffect(() => {
    if (currentQuestion && !questionStartTimes[currentQuestion.id]) {
      setQuestionStartTimes(prev => ({
        ...prev,
        [currentQuestion.id]: Date.now()
      }))
    }
  }, [currentQuestion, questionStartTimes])

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleSubmit()
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (questionId: string, answer: string | number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < quiz.questions.length) {
      setCurrentQuestionIndex(index)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000)

    const quizAnswers: QuizAnswer[] = quiz.questions.map(question => {
      const answer = answers[question.id]
      const questionTime = questionStartTimes[question.id]
      const timeSpent = questionTime ? Math.floor((Date.now() - questionTime) / 1000) : 0

      let isCorrect = false
      if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
        isCorrect = answer === question.correctAnswer
      } else if (question.type === "SHORT_ANSWER") {
        isCorrect = typeof answer === "string" &&
          answer.toLowerCase().trim() === String(question.correctAnswer).toLowerCase().trim()
      }

      return {
        questionId: question.id,
        answer: answer || "",
        isCorrect,
        timeSpent
      }
    })

    onComplete(quizAnswers, totalTimeSpent)
  }

  const getProgressPercentage = () => {
    const answeredQuestions = quiz.questions.filter(q => answers[q.id] !== undefined).length
    return (answeredQuestions / quiz.questions.length) * 100
  }

  const renderQuestion = (question: QuizQuestion) => {
    const userAnswer = answers[question.id]

    switch (question.type) {
      case "MULTIPLE_CHOICE":
        return (
          <RadioGroup
            value={String(userAnswer || "")}
            onValueChange={(value) => handleAnswerChange(question.id, parseInt(value))}
            className="space-y-3"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={String(index)} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "TRUE_FALSE":
        return (
          <RadioGroup
            value={String(userAnswer || "")}
            onValueChange={(value) => handleAnswerChange(question.id, value === "true")}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${question.id}-true`} />
              <Label htmlFor={`${question.id}-true`} className="cursor-pointer">
                True
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${question.id}-false`} />
              <Label htmlFor={`${question.id}-false`} className="cursor-pointer">
                False
              </Label>
            </div>
          </RadioGroup>
        )

      case "SHORT_ANSWER":
        return (
          <Textarea
            value={String(userAnswer || "")}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            className="min-h-[100px]"
          />
        )

      case "CODE_SNIPPET":
        return (
          <Textarea
            value={String(userAnswer || "")}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your code here..."
            className="min-h-[150px] font-mono"
          />
        )

      default:
        return null
    }
  }

  if (status === "NOT_STARTED") {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {quiz.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {quiz.description && (
            <p className="text-gray-600">{quiz.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{quiz.questions.length}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>

            {quiz.timeLimit && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{quiz.timeLimit}</div>
                <div className="text-sm text-gray-600">Minutes</div>
              </div>
            )}

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{quiz.passingScore}%</div>
              <div className="text-sm text-gray-600">To Pass</div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onExit}>
              Exit
            </Button>
            <Button onClick={() => setCurrentQuestionIndex(0)}>
              Start Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">{quiz.title}</h1>
              <Badge variant="secondary">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </Badge>
              {flaggedQuestions.has(currentQuestion.id) && (
                <Badge variant="destructive">
                  <Flag className="w-3 h-3 mr-1" />
                  Flagged
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4">
              {timeLeft !== null && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className={`font-mono ${timeLeft < 300 ? 'text-red-600' : ''}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={onExit}>
                Exit Quiz
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Progress value={getProgressPercentage()} className="h-2" />
            <div className="text-sm text-gray-600 mt-1">
              {Math.round(getProgressPercentage())}% Complete
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    {currentQuestion.question}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{currentQuestion.points} points</span>
                    <Badge variant="outline" className="text-xs">
                      {currentQuestion.type.replace('_', ' ').toLowerCase()}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFlag(currentQuestion.id)}
                  className={flaggedQuestions.has(currentQuestion.id) ? 'text-red-600' : ''}
                >
                  <Flag className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderQuestion(currentQuestion)}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => goToQuestion(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentQuestionIndex === quiz.questions.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Submit Quiz
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => goToQuestion(currentQuestionIndex + 1)}
                    disabled={currentQuestionIndex === quiz.questions.length - 1}
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Navigator */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {quiz.questions.map((question, index) => {
                  const isAnswered = answers[question.id] !== undefined
                  const isCurrent = index === currentQuestionIndex
                  const isFlagged = flaggedQuestions.has(question.id)

                  return (
                    <button
                      key={question.id}
                      onClick={() => goToQuestion(index)}
                      className={`
                        w-10 h-10 rounded text-sm font-medium border-2 transition-colors relative
                        ${isCurrent
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : isAnswered
                            ? 'border-green-500 bg-green-100 text-green-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }
                      `}
                    >
                      {index + 1}
                      {isFlagged && (
                        <Flag className="w-3 h-3 absolute -top-1 -right-1 text-red-500" />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="w-3 h-3 text-red-500" />
                  <span>Flagged</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}