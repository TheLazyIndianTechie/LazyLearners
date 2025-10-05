"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { ArrowLeft, X, Plus, Save, Eye, Trash2, GripVertical, Upload, Copy, Check, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { VideoUploadZone, VideoFile } from "@/components/video/video-upload-zone"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

// Sortable Module Component
function SortableModule({
  module,
  index,
  course,
  selectedModuleId,
  newLessonTitle,
  newLessonType,
  saving,
  setSelectedModuleId,
  setNewLessonTitle,
  setNewLessonType,
  deleteModule,
  addLesson,
  deleteLesson,
  onLessonsReorder,
  onEditVideo,
}: {
  module: Module
  index: number
  course: Course
  selectedModuleId: string | null
  newLessonTitle: string
  newLessonType: "VIDEO" | "TEXT" | "QUIZ"
  saving: boolean
  setSelectedModuleId: (id: string | null) => void
  setNewLessonTitle: (title: string) => void
  setNewLessonType: (type: "VIDEO" | "TEXT" | "QUIZ") => void
  deleteModule: (id: string) => void
  addLesson: (moduleId: string) => void
  deleteLesson: (moduleId: string, lessonId: string) => void
  onLessonsReorder: (moduleId: string, lessons: Lesson[]) => void
  onEditVideo?: (moduleId: string, lessonId: string) => void
  onDuplicateModule?: (moduleId: string) => void
  onSaveModuleAsTemplate?: (moduleId: string) => void
  onDuplicateLesson?: (moduleId: string, lessonId: string) => void
  onSaveLessonAsTemplate?: (moduleId: string, lessonId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleLessonDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = module.lessons.findIndex((l) => l.id === active.id)
    const newIndex = module.lessons.findIndex((l) => l.id === over.id)

    const reorderedLessons = arrayMove(module.lessons, oldIndex, newIndex).map(
      (lesson, idx) => ({ ...lesson, order: idx })
    )

    onLessonsReorder(module.id, reorderedLessons)
  }

  return (
    <Card ref={setNodeRef} style={style}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
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
              onClick={() => onDuplicateModule?.(module.id)}
              title="Duplicate Module"
              disabled={saving}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSaveModuleAsTemplate?.(module.id)}
              title="Save as Template"
              disabled={saving}
            >
              <Save className="h-4 w-4" />
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleLessonDragEnd}
          >
            <SortableContext
              items={module.lessons.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {module.lessons.map((lesson) => (
                  <SortableLesson
                    key={lesson.id}
                    lesson={lesson}
                    moduleId={module.id}
                    saving={saving}
                    deleteLesson={deleteLesson}
                    onEditVideo={onEditVideo}
                    onDuplicateLesson={onDuplicateLesson}
                    onSaveLessonAsTemplate={onSaveLessonAsTemplate}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
  )
}

// Sortable Lesson Component
function SortableLesson({
  lesson,
  moduleId,
  saving,
  deleteLesson,
  onEditVideo,
}: {
  lesson: Lesson
  moduleId: string
  saving: boolean
  deleteLesson: (moduleId: string, lessonId: string) => void
  onEditVideo?: (moduleId: string, lessonId: string) => void
  onDuplicateLesson?: (moduleId: string, lessonId: string) => void
  onSaveLessonAsTemplate?: (moduleId: string, lessonId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2 border rounded bg-background"
    >
      <div className="flex items-center gap-2 flex-1">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
        <span className="text-sm">{lesson.title}</span>
        <Badge variant="outline" className="text-xs">
          {lesson.type}
        </Badge>
        {lesson.videoUrl && (
          <Badge variant="default" className="text-xs bg-green-600">
            Video uploaded
          </Badge>
        )}
      </div>
      <div className="flex gap-1">
        {lesson.type === "VIDEO" && onEditVideo && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEditVideo(moduleId, lesson.id)}
            title="Upload/Edit Video"
          >
            <Upload className="h-3 w-3" />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDuplicateLesson?.(moduleId, lesson.id)}
          title="Duplicate Lesson"
          disabled={saving}
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onSaveLessonAsTemplate?.(moduleId, lesson.id)}
          title="Save as Template"
          disabled={saving}
        >
          <Save className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => deleteLesson(moduleId, lesson.id)}
          disabled={saving}
          title="Delete Lesson"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
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
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lessonId: string } | null>(null)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [templateType, setTemplateType] = useState<'module' | 'lesson' | null>(null)
  const [templateSource, setTemplateSource] = useState<{ moduleId?: string; lessonId?: string } | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const saveQueueRef = useRef<Partial<Course> | null>(null)

  // Initialize DnD sensors for modules
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (!user?.id) {
      router.push("/auth/signin")
      return
    }
    fetchCourse()
  }, [user, params.id])

  // Keyboard shortcut for manual save (Cmd/Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (hasUnsavedChanges && saveQueueRef.current) {
          performAutoSave()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasUnsavedChanges])

  // Auto-save effect
  useEffect(() => {
    if (hasUnsavedChanges && saveQueueRef.current) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      // Set new timer for auto-save (3 seconds debounce)
      autoSaveTimerRef.current = setTimeout(() => {
        performAutoSave()
      }, 3000)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [hasUnsavedChanges, saveQueueRef.current])

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

  const performAutoSave = async () => {
    if (!course || !saveQueueRef.current) return

    try {
      setAutoSaveStatus('saving')
      const updates = saveQueueRef.current
      saveQueueRef.current = null
      setHasUnsavedChanges(false)

      const response = await fetch(`/api/courses/${course.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to auto-save course")
      }

      const data = await response.json()
      setCourse(data.course)
      setAutoSaveStatus('saved')
      setLastSavedAt(new Date())

      // Reset to idle after 2 seconds
      setTimeout(() => setAutoSaveStatus('idle'), 2000)
    } catch (error: any) {
      console.error("Auto-save failed:", error)
      setAutoSaveStatus('error')
      // Keep the failed updates in queue for retry
      setTimeout(() => setAutoSaveStatus('idle'), 3000)
    }
  }

  const queueAutoSave = useCallback((updates: Partial<Course>) => {
    // Merge with existing queued updates
    saveQueueRef.current = {
      ...saveQueueRef.current,
      ...updates,
    }
    setHasUnsavedChanges(true)
  }, [])

  const updateCourse = async (updates: Partial<Course>, immediate = false) => {
    if (!course) return

    // For immediate saves (like publishing), don't use auto-save
    if (immediate) {
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
    } else {
      // Queue for auto-save
      setCourse(prev => prev ? { ...prev, ...updates } : null)
      queueAutoSave(updates)
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

  const getPublishValidationErrors = () => {
    if (!course) return []
    
    const errors: string[] = []
    
    // Basic info validation
    if (!course.title || course.title.trim().length === 0) {
      errors.push("Course must have a title")
    }
    if (!course.description || course.description.trim().length === 0) {
      errors.push("Course must have a description")
    }
    if (!course.thumbnail || course.thumbnail.trim().length === 0) {
      errors.push("Course must have a thumbnail image")
    }
    
    // Content validation
    if (course.modules.length === 0) {
      errors.push("Course must have at least one module")
    } else {
      const modulesWithoutLessons = course.modules.filter(m => m.lessons.length === 0)
      if (modulesWithoutLessons.length > 0) {
        errors.push(`${modulesWithoutLessons.length} module(s) have no lessons`)
      }
      
      const videoLessonsWithoutVideos = course.modules
        .flatMap(m => m.lessons)
        .filter(l => l.type === 'VIDEO' && !l.videoUrl)
      
      if (videoLessonsWithoutVideos.length > 0) {
        errors.push(`${videoLessonsWithoutVideos.length} video lesson(s) are missing video content`)
      }
    }
    
    // Pricing validation
    if (course.price === undefined || course.price < 0) {
      errors.push("Course must have a valid price (set to 0 for free)")
    }
    
    // Metadata validation
    if (course.objectives.length === 0) {
      errors.push("Course should have at least one learning objective")
    }
    
    return errors
  }
  
  const getPublishValidationWarnings = () => {
    if (!course) return []
    
    const warnings: string[] = []
    
    if (course.requirements.length === 0) {
      warnings.push("No course requirements specified")
    }
    if (course.tags.length === 0) {
      warnings.push("No tags added for better discoverability")
    }
    if (course.modules.length < 3) {
      warnings.push("Course has fewer than 3 modules (recommended minimum)")
    }
    
    const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
    if (totalLessons < 5) {
      warnings.push("Course has fewer than 5 lessons (recommended minimum)")
    }
    
    return warnings
  }

  const togglePublishStatus = async () => {
    if (!course) return
    
    // If trying to publish, validate first
    if (!course.published) {
      const errors = getPublishValidationErrors()
      if (errors.length > 0) {
        setShowPublishDialog(true)
        return
      }
      
      // Show confirmation dialog if there are warnings
      const warnings = getPublishValidationWarnings()
      if (warnings.length > 0) {
        setShowPublishDialog(true)
        return
      }
    }
    
    await updateCourse({ published: !course.published })
  }
  
  const handlePublishConfirm = async () => {
    if (course) {
      setShowPublishDialog(false)
      await updateCourse({ published: true }, true) // Immediate save for publishing
    }
  }

  const duplicateModule = async (moduleId: string) => {
    if (!course) return

    const moduleToDuplicate = course.modules.find(m => m.id === moduleId)
    if (!moduleToDuplicate) return

    try {
      setSaving(true)
      
      // Create new module with "Copy of" prefix
      const response = await fetch(`/api/courses/${course.id}/modules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Copy of ${moduleToDuplicate.title}`,
          description: moduleToDuplicate.description,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to duplicate module")
      }

      const { module: newModule } = await response.json()

      // Duplicate all lessons in the module
      const lessonPromises = moduleToDuplicate.lessons.map(async (lesson) => {
        const lessonResponse = await fetch(
          `/api/courses/${course.id}/modules/${newModule.id}/lessons`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: lesson.title,
              description: lesson.description,
              content: lesson.content,
              type: lesson.type,
              videoUrl: lesson.videoUrl,
              duration: lesson.duration,
            }),
          }
        )
        if (!lessonResponse.ok) throw new Error("Failed to duplicate lesson")
        return lessonResponse.json()
      })

      const duplicatedLessons = await Promise.all(lessonPromises)

      // Update local state with new module and lessons
      setCourse(prev => prev ? {
        ...prev,
        modules: [
          ...prev.modules,
          {
            ...newModule,
            lessons: duplicatedLessons.map(result => result.lesson)
          }
        ]
      } : null)

      toast.success(`Module "${moduleToDuplicate.title}" duplicated successfully!`)
    } catch (error: any) {
      console.error("Failed to duplicate module:", error)
      toast.error(error.message || "Failed to duplicate module")
    } finally {
      setSaving(false)
    }
  }

  const duplicateLesson = async (moduleId: string, lessonId: string) => {
    if (!course) return

    const module = course.modules.find(m => m.id === moduleId)
    const lessonToDuplicate = module?.lessons.find(l => l.id === lessonId)
    if (!lessonToDuplicate) return

    try {
      setSaving(true)

      const response = await fetch(
        `/api/courses/${course.id}/modules/${moduleId}/lessons`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Copy of ${lessonToDuplicate.title}`,
            description: lessonToDuplicate.description,
            content: lessonToDuplicate.content,
            type: lessonToDuplicate.type,
            videoUrl: lessonToDuplicate.videoUrl,
            duration: lessonToDuplicate.duration,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to duplicate lesson")
      }

      const { lesson: newLesson } = await response.json()

      // Update local state
      setCourse(prev => prev ? {
        ...prev,
        modules: prev.modules.map(m =>
          m.id === moduleId
            ? { ...m, lessons: [...m.lessons, newLesson] }
            : m
        )
      } : null)

      toast.success(`Lesson "${lessonToDuplicate.title}" duplicated successfully!`)
    } catch (error: any) {
      console.error("Failed to duplicate lesson:", error)
      toast.error(error.message || "Failed to duplicate lesson")
    } finally {
      setSaving(false)
    }
  }

  const saveAsTemplate = (type: 'module' | 'lesson', moduleId: string, lessonId?: string) => {
    setTemplateType(type)
    setTemplateSource({ moduleId, lessonId })
    setShowTemplateDialog(true)
  }

  const handleSaveTemplate = async (templateName: string, category: string) => {
    if (!course || !templateType || !templateSource) return

    try {
      setSaving(true)

      if (templateType === 'module') {
        const module = course.modules.find(m => m.id === templateSource.moduleId)
        if (!module) throw new Error("Module not found")

        const response = await fetch('/api/templates', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: 'module',
            name: templateName,
            category,
            data: {
              title: module.title,
              description: module.description,
              lessons: module.lessons.map(l => ({
                title: l.title,
                description: l.description,
                content: l.content,
                type: l.type,
                duration: l.duration,
              }))
            }
          }),
        })

        if (!response.ok) throw new Error("Failed to save template")
        toast.success("Module saved as template!")
      } else if (templateType === 'lesson') {
        const module = course.modules.find(m => m.id === templateSource.moduleId)
        const lesson = module?.lessons.find(l => l.id === templateSource.lessonId)
        if (!lesson) throw new Error("Lesson not found")

        const response = await fetch('/api/templates', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: 'lesson',
            name: templateName,
            category,
            data: {
              title: lesson.title,
              description: lesson.description,
              content: lesson.content,
              type: lesson.type,
              duration: lesson.duration,
            }
          }),
        })

        if (!response.ok) throw new Error("Failed to save template")
        toast.success("Lesson saved as template!")
      }

      setShowTemplateDialog(false)
      setTemplateType(null)
      setTemplateSource(null)
    } catch (error: any) {
      console.error("Failed to save template:", error)
      toast.error(error.message || "Failed to save template")
    } finally {
      setSaving(false)
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

  const handleModuleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || !course || active.id === over.id) return

    const oldIndex = course.modules.findIndex((m) => m.id === active.id)
    const newIndex = course.modules.findIndex((m) => m.id === over.id)

    const reorderedModules = arrayMove(course.modules, oldIndex, newIndex).map(
      (module, idx) => ({ ...module, order: idx })
    )

    // Optimistically update UI
    setCourse(prev => prev ? { ...prev, modules: reorderedModules } : null)

    // Persist to database
    try {
      const response = await fetch(`/api/courses/${course.id}/modules/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modules: reorderedModules.map(m => ({ id: m.id, order: m.order }))
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save module order")
      }
    } catch (error) {
      console.error("Failed to save module order:", error)
      toast.error("Failed to save module order")
      // Revert on error
      fetchCourse()
    }
  }

  const handleLessonsReorder = async (moduleId: string, reorderedLessons: Lesson[]) => {
    if (!course) return

    // Optimistically update UI
    setCourse(prev => prev ? {
      ...prev,
      modules: prev.modules.map(module =>
        module.id === moduleId ? { ...module, lessons: reorderedLessons } : module
      )
    } : null)

    // Persist to database
    try {
      const response = await fetch(`/api/courses/${course.id}/modules/${moduleId}/lessons/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessons: reorderedLessons.map(l => ({ id: l.id, order: l.order }))
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save lesson order")
      }
    } catch (error) {
      console.error("Failed to save lesson order:", error)
      toast.error("Failed to save lesson order")
      // Revert on error
      fetchCourse()
    }
  }

  const handleEditVideo = (moduleId: string, lessonId: string) => {
    setEditingLesson({ moduleId, lessonId })
  }

  const handleVideoUploadComplete = async (files: VideoFile[]) => {
    if (!files.length || !editingLesson || !course) return

    const uploadedFile = files[0]

    if (uploadedFile.videoUrl && uploadedFile.metadata) {
      try {
        const response = await fetch(
          `/api/courses/${course.id}/modules/${editingLesson.moduleId}/lessons/${editingLesson.lessonId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoUrl: uploadedFile.videoUrl,
              duration: Math.round(uploadedFile.metadata.duration / 60), // Convert to minutes
            }),
          }
        )

        if (!response.ok) {
          throw new Error("Failed to update lesson with video")
        }

        // Update local state
        setCourse(prev => prev ? {
          ...prev,
          modules: prev.modules.map(module =>
            module.id === editingLesson.moduleId
              ? {
                  ...module,
                  lessons: module.lessons.map(lesson =>
                    lesson.id === editingLesson.lessonId
                      ? { ...lesson, videoUrl: uploadedFile.videoUrl, duration: Math.round(uploadedFile.metadata!.duration / 60) }
                      : lesson
                  )
                }
              : module
          )
        } : null)

        toast.success("Video uploaded and linked to lesson!")
        setEditingLesson(null)
      } catch (error: any) {
        console.error("Failed to link video:", error)
        toast.error(error.message || "Failed to link video to lesson")
      }
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

          <div className="flex items-center gap-4">
            {/* Auto-save status indicator */}
            <div className="flex items-center gap-2 text-sm">
              {autoSaveStatus === 'saving' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-muted-foreground">Saving...</span>
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">
                    Saved {lastSavedAt && `at ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                </>
              )}
              {autoSaveStatus === 'error' && (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-500">Save failed</span>
                </>
              )}
              {hasUnsavedChanges && autoSaveStatus === 'idle' && (
                <>
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  <span className="text-muted-foreground">Unsaved changes</span>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {hasUnsavedChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={performAutoSave}
                  disabled={autoSaveStatus === 'saving'}
                  title="Save now (Cmd/Ctrl + S)"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Now
                </Button>
              )}
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
                  Organize your course content into modules and lessons. Drag to reorder.
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
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleModuleDragEnd}
                    >
                      <SortableContext
                        items={course.modules.map((m) => m.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {course.modules.map((module, index) => (
                          <SortableModule
                            key={module.id}
                            module={module}
                            index={index}
                            course={course}
                            selectedModuleId={selectedModuleId}
                            newLessonTitle={newLessonTitle}
                            newLessonType={newLessonType}
                            saving={saving}
                            setSelectedModuleId={setSelectedModuleId}
                            setNewLessonTitle={setNewLessonTitle}
                            setNewLessonType={setNewLessonType}
                            deleteModule={deleteModule}
                            addLesson={addLesson}
                            deleteLesson={deleteLesson}
                            onLessonsReorder={handleLessonsReorder}
                            onEditVideo={handleEditVideo}
                            onDuplicateModule={duplicateModule}
                            onSaveModuleAsTemplate={(moduleId) => saveAsTemplate('module', moduleId)}
                            onDuplicateLesson={duplicateLesson}
                            onSaveLessonAsTemplate={(moduleId, lessonId) => saveAsTemplate('lesson', moduleId, lessonId)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>

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
            {/* Publication Settings */}
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

            {/* Pricing Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing Configuration</CardTitle>
                <CardDescription>
                  Set up pricing, discounts, and payment options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="settings-price">Base Price (USD)</Label>
                    <Input
                      id="settings-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={course.price}
                      onChange={(e) => setCourse(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                      onBlur={(e) => updateCourse({ price: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Set to 0 for free courses</p>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value="USD" disabled>
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">More currencies coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Access Control */}
            <Card>
              <CardHeader>
                <CardTitle>Access Control</CardTitle>
                <CardDescription>
                  Manage who can access your course and how
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="visibility">Course Visibility</Label>
                  <Select value="public" onValueChange={(value) => toast.info("Visibility settings will be available soon")}>
                    <SelectTrigger id="visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Listed in course catalog</SelectItem>
                      <SelectItem value="unlisted">Unlisted - Accessible via direct link only</SelectItem>
                      <SelectItem value="private">Private - Invite only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Public courses appear in search and browse
                  </p>
                </div>

                <div>
                  <Label htmlFor="enrollment-limit">Enrollment Limit (Optional)</Label>
                  <Input
                    id="enrollment-limit"
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty for unlimited enrollments
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <h4 className="font-medium">Prerequisite Courses</h4>
                    <p className="text-sm text-muted-foreground">
                      Require students to complete other courses first
                    </p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Content Release Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Content Release Schedule</CardTitle>
                <CardDescription>
                  Set up drip content to release lessons over time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Drip Content</h4>
                    <p className="text-sm text-muted-foreground">
                      Release lessons gradually after enrollment
                    </p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Drip content scheduling will allow you to release lessons daily, weekly, or on custom schedules.
                  This feature is currently in development.
                </p>
              </CardContent>
            </Card>

            {/* Enrollment Period */}
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Period</CardTitle>
                <CardDescription>
                  Set when students can enroll in your course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="enrollment-start">Enrollment Opens</Label>
                    <Input
                      id="enrollment-start"
                      type="datetime-local"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty to allow immediate enrollment
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="enrollment-end">Enrollment Closes</Label>
                    <Input
                      id="enrollment-end"
                      type="datetime-local"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty for no enrollment deadline
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enrollment period management is coming soon
                </p>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions for this course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" disabled>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Course
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Course deletion will be available soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Template Save Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Save as Template</DialogTitle>
              <DialogDescription>
                Save this {templateType} as a reusable template for future courses
              </DialogDescription>
            </DialogHeader>
            
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const name = formData.get('templateName') as string
                const category = formData.get('category') as string
                if (name && category) {
                  handleSaveTemplate(name, category)
                }
              }}
              className="space-y-4 py-4"
            >
              <div>
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  name="templateName"
                  placeholder="e.g., Introduction Module, Video Lesson Template"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select name="category" required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="introduction">Introduction</SelectItem>
                    <SelectItem value="project-based">Project-Based</SelectItem>
                    <SelectItem value="theory">Theory/Concepts</SelectItem>
                    <SelectItem value="quiz">Quiz/Assessment</SelectItem>
                    <SelectItem value="hands-on">Hands-On Practice</SelectItem>
                    <SelectItem value="advanced">Advanced Topics</SelectItem>
                    <SelectItem value="recap">Recap/Summary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Helps organize templates in the library
                </p>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTemplateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Template"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Publishing Validation Dialog */}
        <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {getPublishValidationErrors().length > 0
                  ? "Cannot Publish Course"
                  : "Ready to Publish?"}
              </DialogTitle>
              <DialogDescription>
                {getPublishValidationErrors().length > 0
                  ? "Please fix the following issues before publishing:"
                  : "Review the checklist below before publishing your course."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Errors Section */}
              {getPublishValidationErrors().length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-destructive flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Required Items
                  </h4>
                  <ul className="space-y-1 ml-6 text-sm">
                    {getPublishValidationErrors().map((error, idx) => (
                      <li key={idx} className="text-destructive list-disc">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Warnings Section */}
              {getPublishValidationWarnings().length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-orange-600 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                    </svg>
                    Recommendations
                  </h4>
                  <ul className="space-y-1 ml-6 text-sm">
                    {getPublishValidationWarnings().map((warning, idx) => (
                      <li key={idx} className="text-orange-600 list-disc">
                        {warning}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground ml-6">
                    These are optional but recommended for a better course
                  </p>
                </div>
              )}
              
              {/* Success checklist when everything is good */}
              {getPublishValidationErrors().length === 0 && getPublishValidationWarnings().length === 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-green-600 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    All Requirements Met
                  </h4>
                  <ul className="space-y-1 ml-6 text-sm">
                    <li className="text-green-600 list-disc">Course has title and description</li>
                    <li className="text-green-600 list-disc">Thumbnail image set</li>
                    <li className="text-green-600 list-disc">At least one module with lessons</li>
                    <li className="text-green-600 list-disc">All video lessons have videos uploaded</li>
                    <li className="text-green-600 list-disc">Pricing configured</li>
                    <li className="text-green-600 list-disc">Learning objectives defined</li>
                  </ul>
                </div>
              )}
              
              {/* Course stats */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Course Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Modules:</span>
                    <span className="ml-2 font-medium">{course.modules.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Lessons:</span>
                    <span className="ml-2 font-medium">
                      {course.modules.reduce((sum, m) => sum + m.lessons.length, 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Video Lessons:</span>
                    <span className="ml-2 font-medium">
                      {course.modules.flatMap(m => m.lessons).filter(l => l.type === 'VIDEO').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price:</span>
                    <span className="ml-2 font-medium">
                      {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPublishDialog(false)}
              >
                Cancel
              </Button>
              {getPublishValidationErrors().length === 0 && (
                <Button
                  onClick={handlePublishConfirm}
                  disabled={saving}
                >
                  {saving ? "Publishing..." : "Publish Course"}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Video Upload Dialog */}
        <Dialog open={!!editingLesson} onOpenChange={() => setEditingLesson(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Lesson Video</DialogTitle>
              <DialogDescription>
                Upload a video for this lesson. The video will be automatically linked once upload is complete.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <VideoUploadZone
                courseId={course.id}
                maxFiles={1}
                onUploadComplete={handleVideoUploadComplete}
                metadata={{
                  moduleId: editingLesson?.moduleId,
                  lessonId: editingLesson?.lessonId,
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SiteLayout>
  )
}