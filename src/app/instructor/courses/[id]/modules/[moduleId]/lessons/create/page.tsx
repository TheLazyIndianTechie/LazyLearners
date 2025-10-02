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
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  FileText,
  PlayCircle,
  Brain,
  Code,
  BookOpen,
  Link as LinkIcon,
  Plus,
  X,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Module {
  id: string
  title: string
  description?: string
  order: number
}

interface Course {
  id: string
  title: string
  modules: Module[]
}

interface LessonFormData {
  title: string
  description: string
  type: 'VIDEO' | 'INTERACTIVE' | 'QUIZ' | 'PROJECT' | 'READING'
  content: string
  duration: number
  videoUrl: string
  resources: LessonResource[]
}

interface LessonResource {
  title: string
  url: string
  type: 'document' | 'link' | 'download' | 'external'
}

interface LessonCreatePageProps {
  params: { id: string; moduleId: string }
}

const lessonTypes = [
  {
    value: 'VIDEO',
    label: 'Video Lesson',
    description: 'Upload or embed video content',
    icon: PlayCircle,
    color: 'text-blue-500'
  },
  {
    value: 'INTERACTIVE',
    label: 'Interactive Content',
    description: 'Code examples, simulations, or interactive demos',
    icon: Code,
    color: 'text-green-500'
  },
  {
    value: 'QUIZ',
    label: 'Quiz',
    description: 'Test student knowledge with questions',
    icon: Brain,
    color: 'text-purple-500'
  },
  {
    value: 'PROJECT',
    label: 'Project Assignment',
    description: 'Hands-on projects and assignments',
    icon: BookOpen,
    color: 'text-orange-500'
  },
  {
    value: 'READING',
    label: 'Reading Material',
    description: 'Text-based content and documentation',
    icon: FileText,
    color: 'text-gray-500'
  }
]

const resourceTypes = [
  { value: 'document', label: 'Document' },
  { value: 'link', label: 'External Link' },
  { value: 'download', label: 'Download' },
  { value: 'external', label: 'External Resource' }
]

export default function LessonCreatePage({ params }: LessonCreatePageProps) {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [currentModule, setCurrentModule] = useState<Module | null>(null)

  const [lessonForm, setLessonForm] = useState<LessonFormData>({
    title: "",
    description: "",
    type: 'VIDEO',
    content: "",
    duration: 0,
    videoUrl: "",
    resources: []
  })

  const [newResource, setNewResource] = useState<LessonResource>({
    title: "",
    url: "",
    type: 'document'
  })

  const [activeTab, setActiveTab] = useState("details")

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/auth/signin")
      return
    }
    fetchCourseAndModule()
  }, [isSignedIn, params.id, params.moduleId])

  const fetchCourseAndModule = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courses/${params.id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch course')
      }

      const data = await response.json()
      setCourse(data.course)

      const module = data.course.modules.find((m: Module) => m.id === params.moduleId)
      if (!module) {
        throw new Error('Module not found')
      }
      setCurrentModule(module)
    } catch (error) {
      console.error('Failed to fetch course and module:', error)
      toast.error("Failed to load course data")
      router.push("/instructor")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLesson = async (publish = false) => {
    if (!lessonForm.title.trim()) {
      toast.error("Lesson title is required")
      return
    }

    if (!course || !currentModule) return

    try {
      setSaving(true)

      const lessonData = {
        ...lessonForm,
        published: publish
      }

      const response = await fetch(`/api/courses/${course.id}/modules/${currentModule.id}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lessonData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create lesson')
      }

      const data = await response.json()

      toast.success(`Lesson ${publish ? 'created and published' : 'saved as draft'} successfully!`)
      router.push(`/instructor/courses/${course.id}/modules`)
    } catch (error: any) {
      console.error('Failed to save lesson:', error)
      toast.error(error.message || "Failed to save lesson")
    } finally {
      setSaving(false)
    }
  }

  const addResource = () => {
    if (!newResource.title.trim() || !newResource.url.trim()) {
      toast.error("Resource title and URL are required")
      return
    }

    setLessonForm(prev => ({
      ...prev,
      resources: [...prev.resources, { ...newResource }]
    }))

    setNewResource({ title: "", url: "", type: 'document' })
  }

  const removeResource = (index: number) => {
    setLessonForm(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }))
  }

  const getContentPlaceholder = () => {
    switch (lessonForm.type) {
      case 'VIDEO':
        return "Video description and key learning points..."
      case 'INTERACTIVE':
        return "Interactive content instructions and setup guide..."
      case 'QUIZ':
        return "Quiz instructions and grading criteria..."
      case 'PROJECT':
        return "Project requirements, objectives, and deliverables..."
      case 'READING':
        return "Reading material content, explanations, and examples..."
      default:
        return "Lesson content..."
    }
  }

  if (loading || !course || !currentModule) {
    return (
      <SiteLayout>
        <div className="container max-w-4xl py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </SiteLayout>
    )
  }

  const selectedLessonType = lessonTypes.find(type => type.value === lessonForm.type)

  return (
    <SiteLayout>
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/instructor/courses/${course.id}/modules`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Modules
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Create New Lesson</h1>
              <p className="text-muted-foreground">
                {course.title} → {currentModule.title}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSaveLesson(false)}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => handleSaveLesson(true)}
              disabled={saving || !lessonForm.title.trim()}
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              Create Lesson
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Lesson Details</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Lesson Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Set up the fundamental details of your lesson
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">Lesson Title *</Label>
                  <Input
                    id="title"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Introduction to Unity Interface"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of what students will learn..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    value={lessonForm.duration || ""}
                    onChange={(e) => setLessonForm(prev => ({
                      ...prev,
                      duration: parseInt(e.target.value) || 0
                    }))}
                    placeholder="e.g., 15"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lesson Type</CardTitle>
                <CardDescription>
                  Choose the type of content for this lesson
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lessonTypes.map((type) => {
                    const IconComponent = type.icon
                    const isSelected = lessonForm.type === type.value

                    return (
                      <Card
                        key={type.value}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setLessonForm(prev => ({ ...prev, type: type.value as any }))}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <IconComponent className={`h-5 w-5 ${type.color}`} />
                            <h4 className="font-medium">{type.label}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                          {isSelected && (
                            <Badge className="mt-2" variant="default">
                              Selected
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {selectedLessonType && (
                    <selectedLessonType.icon className={`h-5 w-5 ${selectedLessonType.color}`} />
                  )}
                  <CardTitle>{selectedLessonType?.label} Content</CardTitle>
                </div>
                <CardDescription>
                  {selectedLessonType?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {lessonForm.type === 'VIDEO' && (
                  <div>
                    <Label htmlFor="videoUrl">Video URL</Label>
                    <Input
                      id="videoUrl"
                      value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                      placeholder="https://example.com/video.mp4 or YouTube/Vimeo URL"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports direct video files, YouTube, Vimeo, and other video platforms
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="content">Lesson Content</Label>
                  <Textarea
                    id="content"
                    value={lessonForm.content}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder={getContentPlaceholder()}
                    rows={12}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports Markdown formatting for rich text content
                  </p>
                </div>

                {lessonForm.type === 'QUIZ' && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-700">
                          <p className="font-medium mb-1">Quiz Content Format</p>
                          <p>
                            Use JSON format to define quiz questions. Example structure will be
                            provided in the quiz builder (coming soon).
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {lessonForm.type === 'INTERACTIVE' && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="text-sm text-green-700">
                          <p className="font-medium mb-1">Interactive Content</p>
                          <p>
                            Embed code examples, simulations, or interactive demos.
                            Supports HTML, CSS, and JavaScript content.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lesson Resources</CardTitle>
                <CardDescription>
                  Add supplementary materials, downloads, and external links
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Resource Form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="resourceTitle">Resource Title</Label>
                    <Input
                      id="resourceTitle"
                      value={newResource.title}
                      onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Unity Asset Pack"
                    />
                  </div>
                  <div>
                    <Label htmlFor="resourceUrl">URL</Label>
                    <Input
                      id="resourceUrl"
                      value={newResource.url}
                      onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="resourceType">Type</Label>
                    <Select
                      value={newResource.type}
                      onValueChange={(value: any) => setNewResource(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {resourceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={addResource}
                      disabled={!newResource.title.trim() || !newResource.url.trim()}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Resources List */}
                {lessonForm.resources.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <LinkIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>No resources added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessonForm.resources.map((resource, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{resource.title}</p>
                            <p className="text-sm text-muted-foreground">{resource.url}</p>
                          </div>
                          <Badge variant="secondary">{resource.type}</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeResource(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lesson Preview</CardTitle>
                <CardDescription>
                  Preview how your lesson will appear to students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-lg p-6 bg-gray-50">
                  <div className="flex items-center gap-3 mb-4">
                    {selectedLessonType && (
                      <selectedLessonType.icon className={`h-6 w-6 ${selectedLessonType.color}`} />
                    )}
                    <div>
                      <h3 className="text-xl font-bold">{lessonForm.title || "Untitled Lesson"}</h3>
                      <p className="text-muted-foreground">
                        {lessonForm.description || "No description provided"}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {selectedLessonType?.label}
                    </Badge>
                  </div>

                  {lessonForm.duration > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                      <Clock className="h-4 w-4" />
                      {lessonForm.duration} minutes
                    </div>
                  )}

                  {lessonForm.content && (
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded border">
                        {lessonForm.content}
                      </pre>
                    </div>
                  )}

                  {lessonForm.videoUrl && (
                    <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-blue-700">
                        <PlayCircle className="h-4 w-4 inline mr-1" />
                        Video: {lessonForm.videoUrl}
                      </p>
                    </div>
                  )}

                  {lessonForm.resources.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Resources</h4>
                      <div className="space-y-2">
                        {lessonForm.resources.map((resource, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <LinkIcon className="h-3 w-3" />
                            <span>{resource.title}</span>
                            <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  )
}