"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, X, Save, ArrowLeft } from "lucide-react"
import { QuizQuestion } from "@/lib/types/quiz"

interface QuestionEditorProps {
  question: QuizQuestion
  onSave: (question: QuizQuestion) => void
  onCancel: () => void
}

export function QuestionEditor({
  question: initialQuestion,
  onSave,
  onCancel,
}: QuestionEditorProps) {
  const [question, setQuestion] = useState(initialQuestion)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateQuestion = (updates: Partial<QuizQuestion>) => {
    setQuestion((prev) => ({ ...prev, ...updates }))
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(question.options || [])]
    newOptions[index] = value
    updateQuestion({ options: newOptions })
  }

  const addOption = () => {
    const newOptions = [...(question.options || []), ""]
    updateQuestion({ options: newOptions })
  }

  const removeOption = (index: number) => {
    const newOptions = (question.options || []).filter((_, i) => i !== index)
    updateQuestion({ options: newOptions })
    // Adjust correct answer if needed
    if (
      question.type === "MULTIPLE_CHOICE" &&
      typeof question.correctAnswer === "number" &&
      question.correctAnswer >= index
    ) {
      updateQuestion({
        correctAnswer: Math.max(0, question.correctAnswer - 1),
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!question.question.trim()) {
      newErrors.question = "Question text is required"
    }

    if (question.points < 1) {
      newErrors.points = "Points must be at least 1"
    }

    if (question.type === "MULTIPLE_CHOICE") {
      const validOptions = (question.options || []).filter((opt) =>
        opt.trim()
      )
      if (validOptions.length < 2) {
        newErrors.options = "At least 2 options are required"
      }
      if (
        typeof question.correctAnswer === "number" &&
        question.correctAnswer >= (question.options || []).length
      ) {
        newErrors.correctAnswer = "Please select the correct answer"
      }
    }

    if (question.type === "SHORT_ANSWER" || question.type === "CODE_SNIPPET") {
      if (!question.correctAnswer || String(question.correctAnswer).trim() === "") {
        newErrors.correctAnswer = "Correct answer is required"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validate()) {
      // Clean up empty options
      if (question.type === "MULTIPLE_CHOICE") {
        const cleanedOptions = (question.options || []).filter((opt) =>
          opt.trim()
        )
        onSave({ ...question, options: cleanedOptions })
      } else {
        onSave(question)
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {question.id.startsWith("q-") ? "New" : "Edit"} Question
          </h2>
          <p className="text-gray-600 mt-1">
            {question.type.replace(/_/g, " ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Question
          </Button>
        </div>
      </div>

      {/* Question Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="question">
              Question Text * {errors.question && <span className="text-red-600 text-xs">({errors.question})</span>}
            </Label>
            <Textarea
              id="question"
              value={question.question}
              onChange={(e) => updateQuestion({ question: e.target.value })}
              placeholder="Enter your question..."
              rows={3}
              className={errors.question ? "border-red-500" : ""}
            />
          </div>

          {/* Points */}
          <div className="space-y-2">
            <Label htmlFor="points">
              Points * {errors.points && <span className="text-red-600 text-xs">({errors.points})</span>}
            </Label>
            <Input
              id="points"
              type="number"
              min="1"
              value={question.points}
              onChange={(e) =>
                updateQuestion({ points: parseInt(e.target.value) || 1 })
              }
              className={errors.points ? "border-red-500" : ""}
            />
          </div>

          {/* Question Type Specific Fields */}
          {question.type === "MULTIPLE_CHOICE" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>
                  Answer Options * {errors.options && <span className="text-red-600 text-xs">({errors.options})</span>}
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={(question.options || []).length >= 6}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              </div>

              <RadioGroup
                value={String(question.correctAnswer)}
                onValueChange={(value) =>
                  updateQuestion({ correctAnswer: parseInt(value) })
                }
              >
                <div className="space-y-3">
                  {(question.options || []).map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <RadioGroupItem
                        value={String(index)}
                        id={`option-${index}`}
                      />
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1"
                      />
                      {(question.options || []).length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </RadioGroup>
              {errors.correctAnswer && (
                <p className="text-sm text-red-600">{errors.correctAnswer}</p>
              )}
              <p className="text-xs text-gray-600">
                Select the radio button next to the correct answer
              </p>
            </div>
          )}

          {question.type === "TRUE_FALSE" && (
            <div className="space-y-2">
              <Label>Correct Answer *</Label>
              <RadioGroup
                value={String(question.correctAnswer)}
                onValueChange={(value) =>
                  updateQuestion({ correctAnswer: value === "true" })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true" className="cursor-pointer">
                    True
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false" className="cursor-pointer">
                    False
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {(question.type === "SHORT_ANSWER" ||
            question.type === "CODE_SNIPPET") && (
            <div className="space-y-2">
              <Label htmlFor="correctAnswer">
                Correct Answer * {errors.correctAnswer && <span className="text-red-600 text-xs">({errors.correctAnswer})</span>}
              </Label>
              {question.type === "CODE_SNIPPET" ? (
                <Textarea
                  id="correctAnswer"
                  value={String(question.correctAnswer)}
                  onChange={(e) =>
                    updateQuestion({ correctAnswer: e.target.value })
                  }
                  placeholder="Enter the correct answer or expected code..."
                  rows={6}
                  className={`font-mono ${errors.correctAnswer ? "border-red-500" : ""}`}
                />
              ) : (
                <Input
                  id="correctAnswer"
                  value={String(question.correctAnswer)}
                  onChange={(e) =>
                    updateQuestion({ correctAnswer: e.target.value })
                  }
                  placeholder="Enter the correct answer..."
                  className={errors.correctAnswer ? "border-red-500" : ""}
                />
              )}
              <p className="text-xs text-gray-600">
                {question.type === "SHORT_ANSWER"
                  ? "Answer comparison is case-insensitive"
                  : "For code challenges, this is the expected solution"}
              </p>
            </div>
          )}

          {/* Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation">
              Explanation (Optional)
            </Label>
            <Textarea
              id="explanation"
              value={question.explanation || ""}
              onChange={(e) =>
                updateQuestion({ explanation: e.target.value })
              }
              placeholder="Provide an explanation for the correct answer..."
              rows={3}
            />
            <p className="text-xs text-gray-600">
              This will be shown to students after they submit their answer
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
