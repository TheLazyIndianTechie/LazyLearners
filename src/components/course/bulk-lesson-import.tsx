"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, Download, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { estimateLessonDuration } from '@/lib/lesson-duration-calculator'

interface ImportedLesson {
  title: string
  description?: string
  type: 'VIDEO' | 'READING' | 'QUIZ' | 'INTERACTIVE' | 'PROJECT'
  content?: string
  videoUrl?: string
  duration?: number
  order: number
  valid: boolean
  errors: string[]
}

interface BulkLessonImportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleId: string
  courseId: string
  onImportComplete: () => void
}

export function BulkLessonImport({
  open,
  onOpenChange,
  moduleId,
  courseId,
  onImportComplete
}: BulkLessonImportProps) {
  const [importedLessons, setImportedLessons] = useState<ImportedLesson[]>([])
  const [importing, setImporting] = useState(false)

  const validateLesson = (lesson: any, index: number): ImportedLesson => {
    const errors: string[] = []

    if (!lesson.title || lesson.title.trim() === '') {
      errors.push('Title is required')
    }

    if (!lesson.type || !['VIDEO', 'READING', 'QUIZ', 'INTERACTIVE', 'PROJECT'].includes(lesson.type)) {
      errors.push('Type must be one of: VIDEO, READING, QUIZ, INTERACTIVE, PROJECT')
    }

    const order = lesson.order !== undefined ? parseInt(lesson.order) : index + 1
    if (isNaN(order) || order < 1) {
      errors.push('Order must be a positive number')
    }

    // Estimate duration if not provided
    let duration = lesson.duration ? parseInt(lesson.duration) : undefined
    if (!duration || isNaN(duration)) {
      const estimate = estimateLessonDuration({
        type: lesson.type,
        content: lesson.content,
        videoLength: lesson.videoUrl ? undefined : duration
      })
      duration = estimate.minutes
    }

    return {
      title: lesson.title || '',
      description: lesson.description,
      type: lesson.type || 'READING',
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      duration,
      order,
      valid: errors.length === 0,
      errors
    }
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const lessons = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const lesson: any = {}

      headers.forEach((header, index) => {
        if (values[index]) {
          lesson[header] = values[index]
        }
      })

      lessons.push(lesson)
    }

    return lessons
  }

  const parseJSON = (text: string): any[] => {
    try {
      const data = JSON.parse(text)
      return Array.isArray(data) ? data : [data]
    } catch (error) {
      throw new Error('Invalid JSON format')
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    const text = await file.text()

    try {
      let lessons: any[]

      if (file.name.endsWith('.csv')) {
        lessons = parseCSV(text)
      } else if (file.name.endsWith('.json')) {
        lessons = parseJSON(text)
      } else {
        toast.error('Unsupported file format. Please use CSV or JSON.')
        return
      }

      if (lessons.length === 0) {
        toast.error('No lessons found in the file.')
        return
      }

      const validatedLessons = lessons.map((lesson, index) => validateLesson(lesson, index))
      setImportedLessons(validatedLessons)

      const validCount = validatedLessons.filter(l => l.valid).length
      const invalidCount = validatedLessons.length - validCount

      if (invalidCount > 0) {
        toast.warning(`Loaded ${validCount} valid lessons and ${invalidCount} invalid lessons. Please fix errors before importing.`)
      } else {
        toast.success(`Loaded ${validCount} lessons successfully!`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to parse file')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    multiple: false
  })

  const handleImport = async () => {
    const validLessons = importedLessons.filter(l => l.valid)

    if (validLessons.length === 0) {
      toast.error('No valid lessons to import')
      return
    }

    try {
      setImporting(true)

      for (const lesson of validLessons) {
        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: lesson.title,
            description: lesson.description,
            type: lesson.type,
            content: lesson.content,
            videoUrl: lesson.videoUrl,
            duration: lesson.duration,
            order: lesson.order
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to import lesson: ${lesson.title}`)
        }
      }

      toast.success(`Successfully imported ${validLessons.length} lessons!`)
      onImportComplete()
      onOpenChange(false)
      setImportedLessons([])
    } catch (error: any) {
      toast.error(error.message || 'Failed to import lessons')
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = (format: 'csv' | 'json') => {
    const template = format === 'csv'
      ? 'title,description,type,content,videoUrl,duration,order\nIntroduction to Unity,Learn Unity basics,VIDEO,,https://example.com/video.mp4,15,1\nUnity Fundamentals,Reading material,READING,Basic concepts of Unity game engine,,10,2'
      : JSON.stringify([
          {
            title: 'Introduction to Unity',
            description: 'Learn Unity basics',
            type: 'VIDEO',
            videoUrl: 'https://example.com/video.mp4',
            duration: 15,
            order: 1
          },
          {
            title: 'Unity Fundamentals',
            description: 'Reading material',
            type: 'READING',
            content: 'Basic concepts of Unity game engine',
            duration: 10,
            order: 2
          }
        ], null, 2)

    const blob = new Blob([template], { type: format === 'csv' ? 'text/csv' : 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lesson-template.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Lessons</DialogTitle>
          <DialogDescription>
            Import multiple lessons at once from a CSV or JSON file
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="template">Download Template</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            {/* Drop Zone */}
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              `}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports CSV and JSON files
              </p>
            </div>

            {/* Preview */}
            {importedLessons.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Preview ({importedLessons.length} lessons)</h4>
                  <div className="flex gap-2">
                    <Badge variant="default">
                      {importedLessons.filter(l => l.valid).length} Valid
                    </Badge>
                    {importedLessons.some(l => !l.valid) && (
                      <Badge variant="destructive">
                        {importedLessons.filter(l => !l.valid).length} Invalid
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {importedLessons.map((lesson, index) => (
                    <Card key={index} className={!lesson.valid ? 'border-destructive' : ''}>
                      <CardHeader className="py-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm flex items-center gap-2">
                              {lesson.valid ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-destructive" />
                              )}
                              {lesson.title || 'Untitled Lesson'}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {lesson.description || 'No description'}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {lesson.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {lesson.duration}m
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      {lesson.errors.length > 0 && (
                        <CardContent className="py-2">
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {lesson.errors.join(', ')}
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="template" className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Download a template file to get started. Fill in your lesson details and upload it.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => downloadTemplate('csv')}>
                <CardContent className="pt-6">
                  <FileText className="h-8 w-8 mb-3 text-muted-foreground" />
                  <h4 className="font-semibold mb-1">CSV Template</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comma-separated values format
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => downloadTemplate('json')}>
                <CardContent className="pt-6">
                  <FileText className="h-8 w-8 mb-3 text-muted-foreground" />
                  <h4 className="font-semibold mb-1">JSON Template</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    JavaScript Object Notation format
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download JSON
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg">
              <h5 className="font-semibold text-sm mb-2">Template Fields</h5>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium">title</dt>
                  <dd className="text-muted-foreground">Lesson title (required)</dd>
                </div>
                <div>
                  <dt className="font-medium">description</dt>
                  <dd className="text-muted-foreground">Brief description (optional)</dd>
                </div>
                <div>
                  <dt className="font-medium">type</dt>
                  <dd className="text-muted-foreground">
                    Lesson type: VIDEO, READING, QUIZ, INTERACTIVE, PROJECT (required)
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">content</dt>
                  <dd className="text-muted-foreground">Lesson content/instructions (optional)</dd>
                </div>
                <div>
                  <dt className="font-medium">videoUrl</dt>
                  <dd className="text-muted-foreground">Video URL for VIDEO type lessons (optional)</dd>
                </div>
                <div>
                  <dt className="font-medium">duration</dt>
                  <dd className="text-muted-foreground">
                    Lesson duration in minutes (optional, will be estimated if not provided)
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">order</dt>
                  <dd className="text-muted-foreground">Display order (optional, defaults to file order)</dd>
                </div>
              </dl>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || importedLessons.filter(l => l.valid).length === 0}
          >
            {importing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
            Import {importedLessons.filter(l => l.valid).length} Lessons
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
