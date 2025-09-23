"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { SiteLayout } from "@/components/layout/site-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, X, Plus } from "lucide-react"
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

interface CourseForm {
  title: string
  description: string
  thumbnail: string
  price: number
  category: string
  engine: string
  difficulty: string
  duration: number
  requirements: string[]
  objectives: string[]
  tags: string[]
}

export default function CreateCoursePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CourseForm>({
    title: "",
    description: "",
    thumbnail: "",
    price: 0,
    category: "",
    engine: "",
    difficulty: "",
    duration: 0,
    requirements: [],
    objectives: [],
    tags: [],
  })
  const [newRequirement, setNewRequirement] = useState("")
  const [newObjective, setNewObjective] = useState("")
  const [newTag, setNewTag] = useState("")

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault()

    if (!session?.user?.id) {
      toast.error("You must be logged in to create a course")
      return
    }

    if (!form.title || !form.description || !form.category || !form.difficulty) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)

    try {
      const courseData = {
        ...form,
        published: publish,
      }

      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courseData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create course")
      }

      const result = await response.json()

      toast.success(`Course ${publish ? 'created and published' : 'saved as draft'} successfully!`)
      router.push(`/instructor`)

    } catch (error: any) {
      console.error("Failed to create course:", error)
      toast.error(error.message || "Failed to create course")
    } finally {
      setLoading(false)
    }
  }

  const addRequirement = () => {
    if (newRequirement.trim() && !form.requirements.includes(newRequirement.trim())) {
      setForm(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }))
      setNewRequirement("")
    }
  }

  const removeRequirement = (requirement: string) => {
    setForm(prev => ({
      ...prev,
      requirements: prev.requirements.filter(r => r !== requirement)
    }))
  }

  const addObjective = () => {
    if (newObjective.trim() && !form.objectives.includes(newObjective.trim())) {
      setForm(prev => ({
        ...prev,
        objectives: [...prev.objectives, newObjective.trim()]
      }))
      setNewObjective("")
    }
  }

  const removeObjective = (objective: string) => {
    setForm(prev => ({
      ...prev,
      objectives: prev.objectives.filter(o => o !== objective)
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  return (
    <SiteLayout>
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/instructor">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Course</h1>
            <p className="text-muted-foreground">
              Build a comprehensive course to share your game development expertise
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Start with the fundamentals of your course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Complete Unity Game Development Course"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what students will learn in this course..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  type="url"
                  value={form.thumbnail}
                  onChange={(e) => setForm(prev => ({ ...prev, thumbnail: e.target.value }))}
                  placeholder="https://example.com/course-thumbnail.jpg"
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
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
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
                  <Label htmlFor="engine">Game Engine</Label>
                  <Select
                    value={form.engine}
                    onValueChange={(value) => setForm(prev => ({ ...prev, engine: value }))}
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
                  <Label htmlFor="difficulty">Difficulty *</Label>
                  <Select
                    value={form.difficulty}
                    onValueChange={(value) => setForm(prev => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
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
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={form.duration || ""}
                    onChange={(e) => setForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    placeholder="e.g., 1200 (20 hours)"
                    required
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
                  value={form.price || ""}
                  onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="e.g., 89.99 (enter 0 for free)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Course Details */}
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>
                Add requirements, objectives, and tags to help students understand your course
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
                  {form.requirements.map((requirement, index) => (
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
                  {form.objectives.map((objective, index) => (
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
                  {form.tags.map((tag, index) => (
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

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/instructor">Cancel</Link>
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={(e) => handleSubmit(e, false)}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              type="submit"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
            >
              {loading ? "Publishing..." : "Create & Publish"}
            </Button>
          </div>
        </form>
      </div>
    </SiteLayout>
  )
}