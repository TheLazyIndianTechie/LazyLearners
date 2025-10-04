"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  GripVertical,
  Trash2,
  Eye,
  Save,
  Settings,
  HelpCircle,
} from "lucide-react"
import { QuizQuestion, Quiz } from "@/lib/types/quiz"
import { QuestionEditor } from "./question-editor"
import { QuizSettings } from "./quiz-settings"
import { QuizPlayer } from "./quiz-player"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface QuizBuilderProps {
  quiz?: Quiz
  lessonId: string
  onSave: (quiz: Partial<Quiz>) => Promise<void>
  onCancel?: () => void
}

interface SortableQuestionItemProps {
  question: QuizQuestion
  index: number
  onEdit: (question: QuizQuestion) => void
  onDelete: (id: string) => void
}

function SortableQuestionItem({
  question,
  index,
  onEdit,
  onDelete,
}: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:border-blue-300 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs">
            {question.type.replace(/_/g, " ")}
          </Badge>
          <span className="text-xs text-gray-500">{question.points} pts</span>
        </div>
        <p className="text-sm font-medium truncate">{question.question}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(question)}
          aria-label="Edit question"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(question.id)}
          className="text-red-600 hover:text-red-700"
          aria-label="Delete question"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export function QuizBuilder({
  quiz,
  lessonId,
  onSave,
  onCancel,
}: QuizBuilderProps) {
  const [title, setTitle] = useState(quiz?.title || "")
  const [description, setDescription] = useState(quiz?.description || "")
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    quiz?.questions || []
  )
  const [passingScore, setPassingScore] = useState(quiz?.passingScore || 70)
  const [timeLimit, setTimeLimit] = useState<number | undefined>(quiz?.timeLimit)
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState("questions")
  const [isSaving, setIsSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const reordered = arrayMove(items, oldIndex, newIndex)
        // Update order property
        return reordered.map((q, idx) => ({ ...q, order: idx }))
      })
    }
  }

  const addQuestion = (type: QuizQuestion["type"]) => {
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      type,
      question: "",
      options: type === "MULTIPLE_CHOICE" ? ["", "", "", ""] : undefined,
      correctAnswer: type === "TRUE_FALSE" ? true : type === "MULTIPLE_CHOICE" ? 0 : "",
      explanation: "",
      points: 1,
      order: questions.length,
    }
    setEditingQuestion(newQuestion)
  }

  const saveQuestion = (question: QuizQuestion) => {
    setQuestions((prev) => {
      const existing = prev.find((q) => q.id === question.id)
      if (existing) {
        return prev.map((q) => (q.id === question.id ? question : q))
      } else {
        return [...prev, question]
      }
    })
    setEditingQuestion(null)
  }

  const deleteQuestion = (id: string) => {
    setQuestions((prev) =>
      prev.filter((q) => q.id !== id).map((q, idx) => ({ ...q, order: idx }))
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const quizData: Partial<Quiz> = {
        id: quiz?.id,
        title,
        description,
        lessonId,
        questions,
        passingScore,
        timeLimit,
        isPublished: quiz?.isPublished || false,
      }
      await onSave(quizData)
    } finally {
      setIsSaving(false)
    }
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  if (showPreview) {
    const previewQuiz: Quiz = {
      id: quiz?.id || "preview",
      title,
      description,
      lessonId,
      questions,
      passingScore,
      timeLimit,
      attempts: 0,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Quiz Preview</h2>
          <Button onClick={() => setShowPreview(false)} variant="outline">
            Back to Editor
          </Button>
        </div>
        <QuizPlayer
          quiz={previewQuiz}
          onComplete={() => {}}
          onExit={() => setShowPreview(false)}
        />
      </div>
    )
  }

  if (editingQuestion) {
    return (
      <QuestionEditor
        question={editingQuestion}
        onSave={saveQuestion}
        onCancel={() => setEditingQuestion(null)}
      />
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quiz Builder</h1>
          <p className="text-gray-600 mt-1">
            Create and manage quiz questions for your lesson
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={questions.length === 0}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title || questions.length === 0}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Quiz"}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="questions">
            Questions ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-6">
          {/* Quiz Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter quiz title..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter quiz description..."
                  rows={3}
                />
              </div>

              {questions.length > 0 && (
                <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">{questions.length}</span> questions
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{totalPoints}</span> total points
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{passingScore}%</span> to pass
                  </div>
                  {timeLimit && (
                    <div className="text-sm">
                      <span className="font-medium">{timeLimit}</span> min limit
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Question */}
          <Card>
            <CardHeader>
              <CardTitle>Add Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  onClick={() => addQuestion("MULTIPLE_CHOICE")}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs">Multiple Choice</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addQuestion("TRUE_FALSE")}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs">True/False</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addQuestion("SHORT_ANSWER")}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs">Short Answer</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addQuestion("CODE_SNIPPET")}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs">Code Challenge</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Questions List */}
          {questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Questions</CardTitle>
                <p className="text-sm text-gray-600">
                  Drag to reorder questions
                </p>
              </CardHeader>
              <CardContent>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={questions.map((q) => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {questions.map((question, index) => (
                        <SortableQuestionItem
                          key={question.id}
                          question={question}
                          index={index}
                          onEdit={setEditingQuestion}
                          onDelete={deleteQuestion}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <QuizSettings
            passingScore={passingScore}
            timeLimit={timeLimit}
            onPassingScoreChange={setPassingScore}
            onTimeLimitChange={setTimeLimit}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
