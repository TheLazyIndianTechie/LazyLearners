"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { SiteLayout } from "@/components/layout/site-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  Plus,
  X,
  Info,
  BookOpen
} from "lucide-react"

interface CourseForm {
  // Basic Info
  title: string
  description: string
  shortDescription: string
  thumbnail: string
  category: string
  engine: string
  difficulty: string

  // Pricing & Access
  price: number
  currency: string
  isPublic: boolean

  // Course Details
  duration: number
  requirements: string[]
  objectives: string[]
  tags: string[]

  // Content Structure
  modules: Array<{
    id: string
    title: string
    description: string
    lessons: Array<{
      id: string
      title: string
      type: "VIDEO" | "QUIZ" | "ASSIGNMENT"
      description: string
    }>
  }>
}

const STEPS = [
  { id: 1, title: "Basic Information", description: "Course title, description, and category" },
  { id: 2, title: "Course Details", description: "Requirements, objectives, and difficulty" },
  { id: 3, title: "Pricing & Publishing", description: "Set price and visibility settings" },
  { id: 4, title: "Course Structure", description: "Add modules and lessons" },
  { id: 5, title: "Review & Publish", description: "Review all details and publish" }
]

const CATEGORIES = [
  { value: "unity-development", label: "Unity Development" },
  { value: "unreal-development", label: "Unreal Development" },
  { value: "godot-development", label: "Godot Development" },
  { value: "game-design", label: "Game Design" },
  { value: "programming", label: "Programming" },
  { value: "art-animation", label: "Art & Animation" },
  { value: "audio-music", label: "Audio & Music" }
]

const ENGINES = [
  { value: "unity", label: "Unity" },
  { value: "unreal", label: "Unreal Engine" },
  { value: "godot", label: "Godot" },
  { value: "custom", label: "Custom/Other" }
]

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" }
]

export default function CreateCoursePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CourseForm>({
    title: "",
    description: "",
    shortDescription: "",
    thumbnail: "",
    category: "",
    engine: "",
    difficulty: "",
    price: 0,
    currency: "USD",
    isPublic: true,
    duration: 0,
    requirements: [""],
    objectives: [""],
    tags: [""],
    modules: []
  })

  // Redirect if not instructor
  if (!session || (session.user?.role !== "instructor" && session.user?.role !== "admin")) {
    router.push("/")
    return null
  }

  const updateFormData = (field: keyof CourseForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addArrayItem = (field: 'requirements' | 'objectives' | 'tags') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }))
  }

  const updateArrayItem = (field: 'requirements' | 'objectives' | 'tags', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const removeArrayItem = (field: 'requirements' | 'objectives' | 'tags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const addModule = () => {
    const newModule = {
      id: `module-${Date.now()}`,
      title: "",
      description: "",
      lessons: []
    }
    setFormData(prev => ({
      ...prev,
      modules: [...prev.modules, newModule]
    }))
  }

  const updateModule = (moduleIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((module, i) =>
        i === moduleIndex ? { ...module, [field]: value } : module
      )
    }))
  }

  const removeModule = (moduleIndex: number) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== moduleIndex)
    }))
  }

  const addLesson = (moduleIndex: number) => {
    const newLesson = {
      id: `lesson-${Date.now()}`,
      title: "",
      type: "VIDEO" as const,
      description: ""
    }
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((module, i) =>
        i === moduleIndex
          ? { ...module, lessons: [...module.lessons, newLesson] }
          : module
      )
    }))
  }

  const updateLesson = (moduleIndex: number, lessonIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((module, i) =>
        i === moduleIndex
          ? {
              ...module,
              lessons: module.lessons.map((lesson, j) =>
                j === lessonIndex ? { ...lesson, [field]: value } : lesson
              )
            }
          : module
      )
    }))
  }

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((module, i) =>
        i === moduleIndex
          ? { ...module, lessons: module.lessons.filter((_, j) => j !== lessonIndex) }
          : module
      )
    }))
  }

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    // TODO: Implement course creation API call
    console.log("Creating course with data:", formData)

    // For now, redirect to instructor dashboard
    router.push("/instructor/dashboard")
  }

  const progressPercentage = (currentStep / STEPS.length) * 100

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Course Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => updateFormData("title", e.target.value)}
          placeholder="e.g., Complete Unity Game Development Course"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="shortDescription">Short Description *</Label>
        <Textarea
          id="shortDescription"
          value={formData.shortDescription}
          onChange={(e) => updateFormData("shortDescription", e.target.value)}
          placeholder="Brief description for course cards (1-2 sentences)"
          className="mt-1"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="description">Full Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData("description", e.target.value)}
          placeholder="Detailed course description, what students will learn, etc."
          className="mt-1"
          rows={6}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => updateFormData("category", value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="engine">Engine/Platform *</Label>
          <Select value={formData.engine} onValueChange={(value) => updateFormData("engine", value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select engine" />
            </SelectTrigger>
            <SelectContent>
              {ENGINES.map((engine) => (
                <SelectItem key={engine.value} value={engine.value}>
                  {engine.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="difficulty">Difficulty Level *</Label>
          <Select value={formData.difficulty} onValueChange={(value) => updateFormData("difficulty", value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((difficulty) => (
                <SelectItem key={difficulty.value} value={difficulty.value}>
                  {difficulty.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="thumbnail">Course Thumbnail</Label>
        <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG up to 2MB (recommended: 800x450px)
          </p>
        </div>
      </div>
    </div>
  )

  const renderCourseDetails = () => (
    <div className="space-y-6">
      <div>
        <Label>Course Requirements</Label>
        <p className="text-sm text-gray-600 mb-3">
          What should students know or have before taking this course?
        </p>
        <div className="space-y-2">
          {formData.requirements.map((requirement, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={requirement}
                onChange={(e) => updateArrayItem("requirements", index, e.target.value)}
                placeholder="e.g., Basic computer skills"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeArrayItem("requirements", index)}
                disabled={formData.requirements.length === 1}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem("requirements")}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Requirement
          </Button>
        </div>
      </div>

      <div>
        <Label>Learning Objectives</Label>
        <p className="text-sm text-gray-600 mb-3">
          What will students be able to do after completing this course?
        </p>
        <div className="space-y-2">
          {formData.objectives.map((objective, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={objective}
                onChange={(e) => updateArrayItem("objectives", index, e.target.value)}
                placeholder="e.g., Build complete games from scratch"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeArrayItem("objectives", index)}
                disabled={formData.objectives.length === 1}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem("objectives")}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Objective
          </Button>
        </div>
      </div>

      <div>
        <Label>Course Tags</Label>
        <p className="text-sm text-gray-600 mb-3">
          Add relevant tags to help students find your course
        </p>
        <div className="space-y-2">
          {formData.tags.map((tag, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={tag}
                onChange={(e) => updateArrayItem("tags", index, e.target.value)}
                placeholder="e.g., Unity, C#, Game Development"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeArrayItem("tags", index)}
                disabled={formData.tags.length === 1}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem("tags")}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Tag
          </Button>
        </div>
      </div>
    </div>
  )

  const renderPricingPublishing = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="price">Course Price</Label>
        <div className="mt-1 flex gap-2">
          <div className="flex-1">
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => updateFormData("price", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          <Select value={formData.currency} onValueChange={(value) => updateFormData("currency", value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Set to $0 to make this a free course
        </p>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Pricing Guidelines</h4>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• Research similar courses to set competitive pricing</li>
              <li>• Consider offering early-bird discounts for new courses</li>
              <li>• Free courses can help build your reputation and student base</li>
              <li>• You can change pricing later, but students who already purchased won't be affected</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCourseStructure = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Course Modules</h3>
          <p className="text-sm text-gray-600">
            Organize your course content into modules and lessons
          </p>
        </div>
        <Button onClick={addModule}>
          <Plus className="w-4 h-4 mr-2" />
          Add Module
        </Button>
      </div>

      {formData.modules.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No modules yet</h3>
          <p className="mt-2 text-gray-600">
            Start by adding your first module to organize your course content
          </p>
          <Button onClick={addModule} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Module
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {formData.modules.map((module, moduleIndex) => (
            <Card key={module.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={module.title}
                      onChange={(e) => updateModule(moduleIndex, "title", e.target.value)}
                      placeholder="Module title"
                      className="font-medium"
                    />
                    <Textarea
                      value={module.description}
                      onChange={(e) => updateModule(moduleIndex, "description", e.target.value)}
                      placeholder="Module description"
                      rows={2}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeModule(moduleIndex)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Lessons</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addLesson(moduleIndex)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Lesson
                    </Button>
                  </div>

                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="flex gap-2 items-start p-3 border rounded">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={lesson.title}
                          onChange={(e) => updateLesson(moduleIndex, lessonIndex, "title", e.target.value)}
                          placeholder="Lesson title"
                          size="sm"
                        />
                        <div className="flex gap-2">
                          <Select
                            value={lesson.type}
                            onValueChange={(value) => updateLesson(moduleIndex, lessonIndex, "type", value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="VIDEO">Video</SelectItem>
                              <SelectItem value="QUIZ">Quiz</SelectItem>
                              <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={lesson.description}
                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, "description", e.target.value)}
                            placeholder="Brief description"
                            size="sm"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLesson(moduleIndex, lessonIndex)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const renderReviewPublish = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">Review Your Course</h3>
        <p className="text-sm text-green-800">
          Please review all the information below before publishing your course.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Title:</strong> {formData.title}</div>
            <div><strong>Category:</strong> {CATEGORIES.find(c => c.value === formData.category)?.label}</div>
            <div><strong>Engine:</strong> {ENGINES.find(e => e.value === formData.engine)?.label}</div>
            <div><strong>Difficulty:</strong> {DIFFICULTIES.find(d => d.value === formData.difficulty)?.label}</div>
            <div><strong>Price:</strong> {formData.price === 0 ? "Free" : `$${formData.price}`}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Course Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Modules:</strong> {formData.modules.length}</div>
              <div><strong>Total Lessons:</strong> {formData.modules.reduce((sum, module) => sum + module.lessons.length, 0)}</div>
              <div><strong>Requirements:</strong> {formData.requirements.filter(r => r.trim()).length}</div>
              <div><strong>Objectives:</strong> {formData.objectives.filter(o => o.trim()).length}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfo()
      case 2:
        return renderCourseDetails()
      case 3:
        return renderPricingPublishing()
      case 4:
        return renderCourseStructure()
      case 5:
        return renderReviewPublish()
      default:
        return renderBasicInfo()
    }
  }

  return (
    <SiteLayout>
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Course</h1>
            <p className="text-gray-600">
              Follow the steps below to create and publish your course
            </p>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Course Creation Progress</h3>
              <span className="text-sm text-gray-600">
                Step {currentStep} of {STEPS.length}
              </span>
            </div>
            <Progress value={progressPercentage} className="mb-4" />
            <div className="grid grid-cols-5 gap-2">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`text-center p-2 rounded ${
                    step.id === currentStep
                      ? "bg-blue-50 border border-blue-200"
                      : step.id < currentStep
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    {step.id < currentStep ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <span className={`text-sm font-medium ${
                        step.id === currentStep ? "text-blue-600" : "text-gray-500"
                      }`}>
                        {step.id}
                      </span>
                    )}
                  </div>
                  <div className={`text-xs font-medium ${
                    step.id === currentStep ? "text-blue-900" : "text-gray-700"
                  }`}>
                    {step.title}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep === STEPS.length ? (
            <Button onClick={handleSubmit}>
              <Check className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </SiteLayout>
  )
}