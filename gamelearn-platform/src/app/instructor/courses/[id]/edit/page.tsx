"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { SiteLayout } from "@/components/layout/site-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, X, Plus, Save, Eye, Trash2, GripVertical } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const categories = [
  { value: "GAME_PROGRAMMING", label: "Game Programming" },
  { value: "GAME_DESIGN", label: "Game Design" },
  { value: "GAME_ART", label: "Game Art" },
  { value: "GAME_AUDIO", label: "Game Audio" },
  { value: "UNITY_DEVELOPMENT", label: "Unity Development" },
  { value: "UNREAL_DEVELOPMENT", label: "Unreal Development" },
  { value: "GODOT_DEVELOPMENT", label: "Godot Development" },
  { value: "MOBILE_GAMES", label: "Mobile Games" },
  { value: "INDIE_DEVELOPMENT", label: "Indie Development" },
  { value: "VR_AR_DEVELOPMENT", label: "VR/AR Development" },
]

const engines = [
  { value: "UNITY", label: "Unity" },
  { value: "UNREAL", label: "Unreal Engine" },
  { value: "GODOT", label: "Godot" },
  { value: "CUSTOM", label: "Custom/Other" },
]

const difficulties = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
]

interface Course {
  id: string
  title: string
  description: string
  thumbnail?: string
  price: number
  category: string
  engine?: string
  difficulty: string
  duration: number
  requirements: string[]
  objectives: string[]
  tags: string[]
  published: boolean
  modules: Module[]
}

interface Module {
  id: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  description: string
  content?: string
  videoUrl?: string
  duration: number
  order: number
  type: 'VIDEO' | 'TEXT' | 'QUIZ'
}

interface CourseEditPageProps {
  params: { id: string }
}

export default function CourseEditPage({ params }: CourseEditPageProps) {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [activeTab, setActiveTab] = useState("details")

  // Form states
  const [newRequirement, setNewRequirement] = useState("")
  const [newObjective, setNewObjective] = useState("")
  const [newTag, setNewTag] = useState("")
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [newModuleDescription, setNewModuleDescription] = useState("")

  // Lesson management states
  const [newLessonTitle, setNewLessonTitle] = useState("")
  const [newLessonType, setNewLessonType] = useState<"VIDEO" | "TEXT" | "QUIZ">("VIDEO")
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) {
      router.push("/auth/signin")
      return
    }
    fetchCourse()
  }, [session, params.id])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courses/${params.id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch course')
      }

      const data = await response.json()
      setCourse(data.course)
    } catch (error) {
      console.error('Failed to fetch course:', error)
      toast.error("Failed to load course")
      router.push("/instructor")
    } finally {
      setLoading(false)
    }
  }

  const updateCourse = async (updates: Partial<Course>) => {
    if (!course) return

    try {
      setSaving(true)
      const response = await fetch(`/api/courses/${course.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update course")
      }

      const data = await response.json()
      setCourse(data.course)
      toast.success("Course updated successfully!")
    } catch (error: any) {
      console.error("Failed to update course:", error)
      toast.error(error.message || "Failed to update course")
    } finally {
      setSaving(false)
    }
  }

  const addRequirement = () => {
    if (newRequirement.trim() && course && !course.requirements.includes(newRequirement.trim())) {
      const updatedRequirements = [...course.requirements, newRequirement.trim()]
      updateCourse({ requirements: updatedRequirements })
      setNewRequirement("")
    }
  }

  const removeRequirement = (requirement: string) => {
    if (course) {
      const updatedRequirements = course.requirements.filter(r => r !== requirement)
      updateCourse({ requirements: updatedRequirements })
    }
  }

  const addObjective = () => {
    if (newObjective.trim() && course && !course.objectives.includes(newObjective.trim())) {
      const updatedObjectives = [...course.objectives, newObjective.trim()]
      updateCourse({ objectives: updatedObjectives })
      setNewObjective("")
    }
  }

  const removeObjective = (objective: string) => {
    if (course) {
      const updatedObjectives = course.objectives.filter(o => o !== objective)
      updateCourse({ objectives: updatedObjectives })
    }
  }

  const addTag = () => {
    if (newTag.trim() && course && !course.tags.includes(newTag.trim())) {
      const updatedTags = [...course.tags, newTag.trim()]
      updateCourse({ tags: updatedTags })
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    if (course) {
      const updatedTags = course.tags.filter(t => t !== tag)
      updateCourse({ tags: updatedTags })
    }
  }

  const togglePublishStatus = async () => {
    if (course) {
      await updateCourse({ published: !course.published })
    }
  }

  const addModule = async () => {
    if (!newModuleTitle.trim() || !newModuleDescription.trim() || !course) return

    try {
      setSaving(true)
      const response = await fetch(`/api/courses/${course.id}/modules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newModuleTitle.trim(),
          description: newModuleDescription.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create module")
      }

      const data = await response.json()

      // Update course with new module
      setCourse(prev => prev ? {
        ...prev,
        modules: [...prev.modules, data.module]
      } : null)

      setNewModuleTitle("")
      setNewModuleDescription("")
      toast.success("Module created successfully!")
    } catch (error: any) {
      console.error("Failed to create module:", error)
      toast.error(error.message || "Failed to create module")
    } finally {
      setSaving(false)
    }
  }

  const deleteModule = async (moduleId: string) => {
    if (!course || !confirm("Are you sure you want to delete this module? This will also delete all lessons in it.")) return

    try {
      setSaving(true)
      const response = await fetch(`/api/courses/${course.id}/modules/${moduleId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete module")
      }

      // Update course by removing the module
      setCourse(prev => prev ? {
        ...prev,
        modules: prev.modules.filter(m => m.id !== moduleId)
      } : null)

      toast.success("Module deleted successfully!")
    } catch (error: any) {
      console.error("Failed to delete module:", error)
      toast.error(error.message || "Failed to delete module")
    } finally {
      setSaving(false)
    }
  }

  const addLesson = async (moduleId: string) => {
    if (!newLessonTitle.trim() || !course) return

    try {
      setSaving(true)
      const response = await fetch(`/api/courses/${course.id}/modules/${moduleId}/lessons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newLessonTitle.trim(),
          type: newLessonType,
          content: "",
          duration: 0,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create lesson")
      }

      const data = await response.json()

      // Update course with new lesson
      setCourse(prev => prev ? {
        ...prev,
        modules: prev.modules.map(module =>
          module.id === moduleId
            ? { ...module, lessons: [...module.lessons, data.lesson] }
            : module
        )
      } : null)

      setNewLessonTitle("")
      setSelectedModuleId(null)
      toast.success("Lesson created successfully!")
    } catch (error: any) {
      console.error("Failed to create lesson:", error)
      toast.error(error.message || "Failed to create lesson")
    } finally {
      setSaving(false)
    }
  }

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    if (!course || !confirm("Are you sure you want to delete this lesson?")) return

    try {
      setSaving(true)
      const response = await fetch(`/api/courses/${course.id}/modules/${moduleId}/lessons/${lessonId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete lesson")
      }

      // Update course by removing the lesson
      setCourse(prev => prev ? {
        ...prev,
        modules: prev.modules.map(module =>
          module.id === moduleId
            ? { ...module, lessons: module.lessons.filter(l => l.id !== lessonId) }
            : module
        )
      } : null)

      toast.success("Lesson deleted successfully!")
    } catch (error: any) {
      console.error("Failed to delete lesson:", error)
      toast.error(error.message || "Failed to delete lesson")
    } finally {
      setSaving(false)
    }
  }

  if (loading || !course) {
    return (
      <SiteLayout>
        <div className="container max-w-4xl py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </SiteLayout>
    )
  }

  return (
    <SiteLayout>
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/instructor">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Course</h1>
              <p className="text-muted-foreground">
                {course.title}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/courses/${course.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Link>
            </Button>
            <Button
              onClick={togglePublishStatus}
              variant={course.published ? "outline" : "default"}
              disabled={saving}
            >
              {course.published ? "Unpublish" : "Publish"}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Course Details</TabsTrigger>
            <TabsTrigger value="content">Course Content</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Course Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Update the core information about your course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    value={course.title}
                    onChange={(e) => setCourse(prev => prev ? { ...prev, title: e.target.value } : null)}
                    onBlur={(e) => updateCourse({ title: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={course.description}
                    onChange={(e) => setCourse(prev => prev ? { ...prev, description: e.target.value } : null)}
                    onBlur={(e) => updateCourse({ description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="thumbnail">Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    type="url"
                    value={course.thumbnail || ""}
                    onChange={(e) => setCourse(prev => prev ? { ...prev, thumbnail: e.target.value } : null)}
                    onBlur={(e) => updateCourse({ thumbnail: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Course Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Course Settings</CardTitle>
                <CardDescription>
                  Configure the core parameters of your course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={course.category}
                      onValueChange={(value) => updateCourse({ category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Game Engine</Label>
                    <Select
                      value={course.engine || ""}
                      onValueChange={(value) => updateCourse({ engine: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an engine" />
                      </SelectTrigger>
                      <SelectContent>
                        {engines.map((engine) => (
                          <SelectItem key={engine.value} value={engine.value}>
                            {engine.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Difficulty</Label>
                    <Select
                      value={course.difficulty}
                      onValueChange={(value) => updateCourse({ difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {difficulties.map((difficulty) => (
                          <SelectItem key={difficulty.value} value={difficulty.value}>
                            {difficulty.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={course.duration}
                      onChange={(e) => setCourse(prev => prev ? { ...prev, duration: parseInt(e.target.value) || 0 } : null)}
                      onBlur={(e) => updateCourse({ duration: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={course.price}
                    onChange={(e) => setCourse(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                    onBlur={(e) => updateCourse({ price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Course Details */}
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
                <CardDescription>
                  Manage requirements, objectives, and tags
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Requirements */}
                <div>
                  <Label>Requirements</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      placeholder="Add a requirement..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                    />
                    <Button type="button" onClick={addRequirement} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {course.requirements.map((requirement, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {requirement}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeRequirement(requirement)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Objectives */}
                <div>
                  <Label>Learning Objectives</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      placeholder="Add a learning objective..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                    />
                    <Button type="button" onClick={addObjective} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {course.objectives.map((objective, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {objective}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeObjective(objective)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {course.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Course Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Modules</CardTitle>
                <CardDescription>
                  Organize your course content into modules and lessons
                </CardDescription>
              </CardHeader>
              <CardContent>
                {course.modules.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No modules created yet</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Module title..."
                        value={newModuleTitle}
                        onChange={(e) => setNewModuleTitle(e.target.value)}
                      />
                      <Input
                        placeholder="Module description..."
                        value={newModuleDescription}
                        onChange={(e) => setNewModuleDescription(e.target.value)}
                      />
                      <Button
                        onClick={addModule}
                        disabled={saving || !newModuleTitle.trim() || !newModuleDescription.trim()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Module
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {course.modules.map((module, index) => (
                      <Card key={module.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <CardTitle className="text-lg">{module.title}</CardTitle>
                                <CardDescription>{module.description}</CardDescription>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Add Lesson"
                                onClick={() => setSelectedModuleId(selectedModuleId === module.id ? null : module.id)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteModule(module.id)}
                                title="Delete Module"
                                disabled={saving}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {module.lessons.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No lessons yet</p>
                          ) : (
                            <div className="space-y-2">
                              {module.lessons.map((lesson) => (
                                <div key={lesson.id} className="flex items-center justify-between p-2 border rounded">
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm">{lesson.title}</span>
                                    <Badge variant="outline" size="sm">
                                      {lesson.type}
                                    </Badge>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteLesson(module.id, lesson.id)}
                                      disabled={saving}
                                      title="Delete Lesson"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Lesson Form */}
                          {selectedModuleId === module.id && (
                            <div className="border-t pt-4 mt-4">
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Lesson title..."
                                  value={newLessonTitle}
                                  onChange={(e) => setNewLessonTitle(e.target.value)}
                                  className="flex-1"
                                />
                                <Select value={newLessonType} onValueChange={(value: "VIDEO" | "TEXT" | "QUIZ") => setNewLessonType(value)}>
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="VIDEO">Video</SelectItem>
                                    <SelectItem value="TEXT">Text</SelectItem>
                                    <SelectItem value="QUIZ">Quiz</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  onClick={() => addLesson(module.id)}
                                  disabled={saving || !newLessonTitle.trim()}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedModuleId(null)
                                    setNewLessonTitle("")
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {/* Add New Module */}
                    <Card className="border-dashed">
                      <CardContent className="pt-6">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Module title..."
                            value={newModuleTitle}
                            onChange={(e) => setNewModuleTitle(e.target.value)}
                          />
                          <Input
                            placeholder="Module description..."
                            value={newModuleDescription}
                            onChange={(e) => setNewModuleDescription(e.target.value)}
                          />
                          <Button
                            onClick={addModule}
                            disabled={saving || !newModuleTitle.trim() || !newModuleDescription.trim()}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Module
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publication Settings</CardTitle>
                <CardDescription>
                  Control how your course is published and accessed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Course Status</h4>
                    <p className="text-sm text-muted-foreground">
                      {course.published ? "Your course is published and visible to students" : "Your course is saved as a draft"}
                    </p>
                  </div>
                  <Badge variant={course.published ? "default" : "secondary"}>
                    {course.published ? "Published" : "Draft"}
                  </Badge>
                </div>

                <Button onClick={togglePublishStatus} disabled={saving}>
                  {course.published ? "Unpublish Course" : "Publish Course"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions for this course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Course
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  )
}