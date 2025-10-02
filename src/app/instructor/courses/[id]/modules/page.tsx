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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Edit,
  Trash2,
  Save,
  Clock,
  BookOpen,
  PlayCircle,
  FileText,
  Brain,
  Code,
  AlertCircle
} from "lucide-react"
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
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Course {
  id: string
  title: string
  description: string
  published: boolean
  modules: Module[]
}

interface Module {
  id: string
  title: string
  description?: string
  order: number
  duration: number
  createdAt: Date
  updatedAt: Date
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  description?: string
  type: 'VIDEO' | 'INTERACTIVE' | 'QUIZ' | 'PROJECT' | 'READING'
  content?: string
  order: number
  duration: number
  videoUrl?: string
}

interface ModuleFormData {
  title: string
  description: string
  duration: number
}

interface ModuleManagementPageProps {
  params: { id: string }
}

// Sortable Lesson Component
function SortableLesson({
  lesson,
  getLessonTypeIcon,
  formatDuration,
  courseId,
  moduleId
}: {
  lesson: Lesson
  getLessonTypeIcon: (type: string) => React.ReactNode
  formatDuration: (minutes: number) => string
  courseId: string
  moduleId: string
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
      className={`
        flex items-center justify-between p-3 border rounded-lg
        hover:bg-muted/50 transition-colors
        ${isDragging ? 'ring-2 ring-primary z-10' : ''}
      `}
    >
      <div className="flex items-center gap-3 flex-1">
        <div
          className="cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </div>
        {getLessonTypeIcon(lesson.type)}
        <div className="flex-1">
          <div className="font-medium text-sm">{lesson.title}</div>
          <div className="text-xs text-muted-foreground">
            {lesson.description || `${lesson.type} lesson`} • {formatDuration(lesson.duration)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="text-xs">
          {lesson.type}
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          asChild
          title="Edit Lesson"
        >
          <Link href={`/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/edit`}>
            <Edit className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

// Sortable Module Component
function SortableModule({
  module,
  onEdit,
  onDelete,
  onAddLesson,
  onLessonReorder
}: {
  module: Module
  onEdit: (module: Module) => void
  onDelete: (moduleId: string) => void
  onAddLesson: (moduleId: string) => void
  onLessonReorder: (moduleId: string, event: DragEndEvent) => void
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <PlayCircle className="h-4 w-4 text-blue-500" />
      case 'INTERACTIVE':
        return <Code className="h-4 w-4 text-green-500" />
      case 'QUIZ':
        return <Brain className="h-4 w-4 text-purple-500" />
      case 'PROJECT':
        return <BookOpen className="h-4 w-4 text-orange-500" />
      case 'READING':
        return <FileText className="h-4 w-4 text-gray-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all ${isDragging ? 'ring-2 ring-primary' : ''}`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  Module {module.order}
                </Badge>
              </div>
              <CardDescription className="mt-1">
                {module.description || "No description provided"}
              </CardDescription>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {module.lessons.length} lessons
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(module.duration)}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAddLesson(module.id)}
              title="Add Lesson"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(module)}
              title="Edit Module"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(module.id)}
              title="Delete Module"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {module.lessons.length === 0 ? (
          <div className="text-center py-6 bg-muted/30 rounded-lg border-2 border-dashed">
            <p className="text-sm text-muted-foreground mb-2">No lessons in this module yet</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddLesson(module.id)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Lesson
            </Button>
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={(event) => onLessonReorder(module.id, event)}
          >
            <SortableContext
              items={module.lessons.map(lesson => lesson.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {module.lessons
                  .sort((a, b) => a.order - b.order)
                  .map((lesson) => (
                    <SortableLesson
                      key={lesson.id}
                      lesson={lesson}
                      getLessonTypeIcon={getLessonTypeIcon}
                      formatDuration={formatDuration}
                      courseId={module.id}
                      moduleId={module.id}
                    />
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  )
}

export default function ModuleManagementPage({ params }: ModuleManagementPageProps) {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)

  // Dialog states
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)

  // Form state
  const [moduleForm, setModuleForm] = useState<ModuleFormData>({
    title: "",
    description: "",
    duration: 0
  })

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/auth/signin")
      return
    }
    fetchCourse()
  }, [isSignedIn, params.id])

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !course) return

    if (active.id !== over.id) {
      const oldIndex = course.modules.findIndex((module) => module.id === active.id)
      const newIndex = course.modules.findIndex((module) => module.id === over.id)

      const newModules = arrayMove(course.modules, oldIndex, newIndex).map((module, index) => ({
        ...module,
        order: index + 1
      }))

      setCourse({ ...course, modules: newModules })

      try {
        const response = await fetch(`/api/courses/${course.id}/modules/reorder`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            moduleOrders: newModules.map(module => ({
              id: module.id,
              order: module.order
            }))
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to reorder modules')
        }

        toast.success("Module order updated successfully!")
      } catch (error) {
        console.error('Failed to reorder modules:', error)
        toast.error("Failed to update module order")
        // Revert the change on error
        fetchCourse()
      }
    }
  }

  const openCreateDialog = () => {
    setModuleForm({ title: "", description: "", duration: 0 })
    setEditingModule(null)
    setShowCreateDialog(true)
  }

  const openEditDialog = (module: Module) => {
    setModuleForm({
      title: module.title,
      description: module.description || "",
      duration: module.duration
    })
    setEditingModule(module)
    setShowCreateDialog(true)
  }

  const handleSaveModule = async () => {
    if (!moduleForm.title.trim()) {
      toast.error("Module title is required")
      return
    }

    if (!course) return

    try {
      setSaving(true)

      const url = editingModule
        ? `/api/courses/${course.id}/modules/${editingModule.id}`
        : `/api/courses/${course.id}/modules`

      const method = editingModule ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moduleForm),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${editingModule ? 'update' : 'create'} module`)
      }

      const data = await response.json()

      if (editingModule) {
        setCourse(prev => prev ? {
          ...prev,
          modules: prev.modules.map(module =>
            module.id === editingModule.id ? { ...module, ...data.module } : module
          )
        } : null)
        toast.success("Module updated successfully!")
      } else {
        setCourse(prev => prev ? {
          ...prev,
          modules: [...prev.modules, data.module]
        } : null)
        toast.success("Module created successfully!")
      }

      setShowCreateDialog(false)
      setEditingModule(null)
    } catch (error: any) {
      console.error('Failed to save module:', error)
      toast.error(error.message || "Failed to save module")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (!course) return

    try {
      setSaving(true)
      const response = await fetch(`/api/courses/${course.id}/modules/${moduleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete module')
      }

      setCourse(prev => prev ? {
        ...prev,
        modules: prev.modules.filter(module => module.id !== moduleId)
      } : null)

      toast.success("Module deleted successfully!")
      setShowDeleteDialog(null)
    } catch (error: any) {
      console.error('Failed to delete module:', error)
      toast.error(error.message || "Failed to delete module")
    } finally {
      setSaving(false)
    }
  }

  const handleAddLesson = (moduleId: string) => {
    router.push(`/instructor/courses/${params.id}/modules/${moduleId}/lessons/create`)
  }

  const handleLessonReorder = async (moduleId: string, event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !course) return

    if (active.id !== over.id) {
      const module = course.modules.find(m => m.id === moduleId)
      if (!module) return

      const oldIndex = module.lessons.findIndex(lesson => lesson.id === active.id)
      const newIndex = module.lessons.findIndex(lesson => lesson.id === over.id)

      const newLessons = arrayMove(module.lessons, oldIndex, newIndex).map((lesson, index) => ({
        ...lesson,
        order: index + 1
      }))

      // Update state optimistically
      setCourse(prev => prev ? {
        ...prev,
        modules: prev.modules.map(m =>
          m.id === moduleId ? { ...m, lessons: newLessons } : m
        )
      } : null)

      try {
        const response = await fetch(`/api/courses/${course.id}/modules/${moduleId}/lessons/reorder`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lessonOrders: newLessons.map(lesson => ({
              id: lesson.id,
              order: lesson.order
            }))
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to reorder lessons')
        }

        toast.success("Lesson order updated successfully!")
      } catch (error) {
        console.error('Failed to reorder lessons:', error)
        toast.error("Failed to update lesson order")
        // Revert the change on error
        fetchCourse()
      }
    }
  }

  if (loading || !course) {
    return (
      <SiteLayout>
        <div className="container max-w-6xl py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
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
              <Link href={`/instructor/courses/${course.id}/edit`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Course Modules</h1>
              <p className="text-muted-foreground">
                {course.title} • {course.modules.length} modules
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/courses/${course.id}`}>
                Preview Course
              </Link>
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>
        </div>

        {/* Course Status */}
        <div className="mb-6">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  {course.published
                    ? "This course is published. Changes will be visible to enrolled students immediately."
                    : "This course is in draft mode. Publish it to make it available to students."
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modules List */}
        {course.modules.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No modules yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first module to start organizing your course content.
                Modules help structure your lessons and create a logical learning path.
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Module
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={course.modules.map(module => module.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {course.modules
                  .sort((a, b) => a.order - b.order)
                  .map((module) => (
                    <SortableModule
                      key={module.id}
                      module={module}
                      onEdit={openEditDialog}
                      onDelete={(moduleId) => setShowDeleteDialog(moduleId)}
                      onAddLesson={handleAddLesson}
                      onLessonReorder={handleLessonReorder}
                    />
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Create/Edit Module Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingModule ? "Edit Module" : "Create New Module"}
              </DialogTitle>
              <DialogDescription>
                {editingModule
                  ? "Update the module details below."
                  : "Add a new module to organize your course content."
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Module Title *</Label>
                <Input
                  id="title"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Getting Started with Unity"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what students will learn in this module..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={moduleForm.duration || ""}
                  onChange={(e) => setModuleForm(prev => ({
                    ...prev,
                    duration: parseInt(e.target.value) || 0
                  }))}
                  placeholder="e.g., 120 (2 hours)"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveModule}
                disabled={saving || !moduleForm.title.trim()}
              >
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                {editingModule ? "Update Module" : "Create Module"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Module</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this module? This will also delete all lessons
                within the module. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => showDeleteDialog && handleDeleteModule(showDeleteDialog)}
                disabled={saving}
              >
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                Delete Module
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SiteLayout>
  )
}