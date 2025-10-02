"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2, FileVideo, Clock, Maximize2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  extractVideoMetadata,
  validateVideoMetadata,
  formatDuration,
  getQualityLabel,
  type VideoMetadata
} from "@/lib/video/metadata"

export interface VideoFile {
  file: File
  id: string
  name: string
  size: number
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  jobId?: string
  videoUrl?: string
  metadata?: VideoMetadata
}

interface VideoUploadZoneProps {
  /**
   * Course ID to associate uploaded videos with (optional)
   */
  courseId?: string

  /**
   * Maximum number of files that can be uploaded at once
   */
  maxFiles?: number

  /**
   * Maximum file size in bytes (default: 2GB)
   */
  maxSize?: number

  /**
   * Callback when files are successfully uploaded
   */
  onUploadComplete?: (files: VideoFile[]) => void

  /**
   * Callback when upload progress changes
   */
  onProgress?: (fileId: string, progress: number) => void

  /**
   * Accepted video formats
   */
  acceptedFormats?: string[]

  /**
   * Enable automatic video processing
   */
  enableProcessing?: boolean

  /**
   * Additional metadata to send with upload
   */
  metadata?: Record<string, any>
}

const DEFAULT_MAX_SIZE = 2 * 1024 * 1024 * 1024 // 2GB
const DEFAULT_ACCEPTED_FORMATS = {
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
  'video/x-matroska': ['.mkv']
}

export function VideoUploadZone({
  courseId,
  maxFiles = 5,
  maxSize = DEFAULT_MAX_SIZE,
  onUploadComplete,
  onProgress,
  acceptedFormats,
  enableProcessing = true,
  metadata = {}
}: VideoUploadZoneProps) {
  const [files, setFiles] = useState<VideoFile[]>([])
  const [uploading, setUploading] = useState(false)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        const errorMessages = errors.map((e: any) => {
          if (e.code === 'file-too-large') {
            return `File is too large. Maximum size is ${formatFileSize(maxSize)}`
          }
          if (e.code === 'file-invalid-type') {
            return 'Invalid file type. Only video files are accepted (mp4, webm, mov, avi, mkv)'
          }
          return e.message
        }).join(', ')

        toast.error(`${file.name}: ${errorMessages}`)
      })
    }

    // Handle accepted files
    if (acceptedFiles.length > 0) {
      const newFiles: VideoFile[] = acceptedFiles.map((file) => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'pending'
      }))

      setFiles(prev => {
        const combined = [...prev, ...newFiles]
        if (combined.length > maxFiles) {
          toast.error(`Maximum ${maxFiles} files allowed. Only the first ${maxFiles} will be kept.`)
          return combined.slice(0, maxFiles)
        }
        return combined
      })

      toast.success(`${acceptedFiles.length} file(s) added. Extracting metadata...`)

      // Extract metadata for each file
      for (const newFile of newFiles) {
        try {
          const metadata = await extractVideoMetadata(newFile.file)

          // Validate metadata
          const validation = validateVideoMetadata(metadata, {
            maxDuration: 4 * 60 * 60, // 4 hours max
            minDuration: 1, // 1 second min
            minWidth: 320,
            minHeight: 240
          })

          if (!validation.isValid) {
            setFiles(prev => prev.map(f =>
              f.id === newFile.id ? {
                ...f,
                status: 'error' as const,
                error: validation.errors.join('; '),
                metadata
              } : f
            ))
            toast.error(`${newFile.name}: ${validation.errors[0]}`)
          } else {
            setFiles(prev => prev.map(f =>
              f.id === newFile.id ? { ...f, metadata } : f
            ))
          }
        } catch (error: any) {
          console.error('Metadata extraction failed:', error)
          setFiles(prev => prev.map(f =>
            f.id === newFile.id ? {
              ...f,
              status: 'error' as const,
              error: 'Failed to extract video metadata'
            } : f
          ))
          toast.error(`${newFile.name}: Failed to extract metadata`)
        }
      }
    }
  }, [maxFiles, maxSize])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    open
  } = useDropzone({
    onDrop,
    accept: acceptedFormats || DEFAULT_ACCEPTED_FORMATS,
    maxSize,
    maxFiles,
    multiple: true,
    noClick: files.length > 0, // Disable click when files are already added
    noKeyboard: files.length > 0
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const uploadFile = async (videoFile: VideoFile): Promise<void> => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f =>
        f.id === videoFile.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
      ))

      const formData = new FormData()
      formData.append('video', videoFile.file)
      formData.append('metadata', JSON.stringify({
        title: videoFile.name,
        courseId,
        generateThumbnails: enableProcessing,
        enableDRM: true,
        duration: videoFile.metadata?.duration,
        width: videoFile.metadata?.width,
        height: videoFile.metadata?.height,
        ...metadata
      }))

      // Upload with progress tracking
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setFiles(prev => prev.map(f =>
            f.id === videoFile.id ? { ...f, progress } : f
          ))
          onProgress?.(videoFile.id, progress)
        }
      })

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } else {
            const error = JSON.parse(xhr.responseText)
            reject(new Error(error.error?.message || 'Upload failed'))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'))
        })

        xhr.open('POST', '/api/video/upload')
        xhr.send(formData)
      })

      const response = await uploadPromise

      if (response.success) {
        setFiles(prev => prev.map(f =>
          f.id === videoFile.id ? {
            ...f,
            status: 'processing' as const,
            progress: 100,
            jobId: response.data.jobId
          } : f
        ))

        // Poll for processing status
        if (enableProcessing) {
          pollProcessingStatus(videoFile.id, response.data.jobId)
        } else {
          setFiles(prev => prev.map(f =>
            f.id === videoFile.id ? { ...f, status: 'completed' as const } : f
          ))
        }

        toast.success(`${videoFile.name} uploaded successfully`)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      setFiles(prev => prev.map(f =>
        f.id === videoFile.id ? {
          ...f,
          status: 'error' as const,
          error: error.message || 'Upload failed'
        } : f
      ))
      toast.error(`Failed to upload ${videoFile.name}: ${error.message}`)
    }
  }

  const pollProcessingStatus = async (fileId: string, jobId: string) => {
    const maxAttempts = 60 // Poll for up to 5 minutes
    let attempts = 0

    const poll = async () => {
      try {
        const response = await fetch(`/api/video/upload?jobId=${jobId}`)
        const data = await response.json()

        if (data.success && data.data.job) {
          const job = data.data.job

          if (job.status === 'completed') {
            setFiles(prev => prev.map(f =>
              f.id === fileId ? {
                ...f,
                status: 'completed' as const,
                videoUrl: job.outputUrl
              } : f
            ))
            return
          } else if (job.status === 'failed') {
            setFiles(prev => prev.map(f =>
              f.id === fileId ? {
                ...f,
                status: 'error' as const,
                error: 'Processing failed'
              } : f
            ))
            return
          }
        }

        // Continue polling
        if (attempts < maxAttempts) {
          attempts++
          setTimeout(poll, 5000) // Poll every 5 seconds
        } else {
          setFiles(prev => prev.map(f =>
            f.id === fileId ? {
              ...f,
              status: 'error' as const,
              error: 'Processing timeout'
            } : f
          ))
        }
      } catch (error) {
        console.error('Status polling error:', error)
      }
    }

    poll()
  }

  const handleUploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')

    if (pendingFiles.length === 0) {
      toast.info('No files to upload')
      return
    }

    setUploading(true)

    // Upload files sequentially to avoid overwhelming the server
    for (const file of pendingFiles) {
      await uploadFile(file)
    }

    setUploading(false)

    const completedFiles = files.filter(f => f.status === 'completed')
    if (completedFiles.length > 0) {
      onUploadComplete?.(completedFiles)
    }
  }

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'))
  }

  const getStatusIcon = (status: VideoFile['status']) => {
    switch (status) {
      case 'pending':
        return <FileVideo className="h-4 w-4 text-muted-foreground" />
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: VideoFile['status']) => {
    const variants: Record<VideoFile['status'], 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      uploading: 'default',
      processing: 'default',
      completed: 'default',
      error: 'destructive'
    }

    const labels: Record<VideoFile['status'], string> = {
      pending: 'Pending',
      uploading: 'Uploading',
      processing: 'Processing',
      completed: 'Completed',
      error: 'Failed'
    }

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    )
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const uploadingCount = files.filter(f => f.status === 'uploading' || f.status === 'processing').length
  const completedCount = files.filter(f => f.status === 'completed').length
  const errorCount = files.filter(f => f.status === 'error').length

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      {files.length === 0 && (
        <Card>
          <CardContent className="p-0">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                transition-all duration-200 ease-in-out
                ${isDragActive && !isDragReject ? 'border-primary bg-primary/5 scale-[1.02]' : ''}
                ${isDragReject ? 'border-destructive bg-destructive/5' : 'border-muted-foreground/25'}
                ${!isDragActive ? 'hover:border-primary hover:bg-primary/5' : ''}
              `}
            >
              <input {...getInputProps()} />

              <div className="flex flex-col items-center gap-4">
                <div className={`
                  rounded-full p-4 transition-colors
                  ${isDragActive && !isDragReject ? 'bg-primary/10' : 'bg-muted'}
                `}>
                  <Upload className={`
                    h-8 w-8 transition-colors
                    ${isDragActive && !isDragReject ? 'text-primary' : 'text-muted-foreground'}
                    ${isDragReject ? 'text-destructive' : ''}
                  `} />
                </div>

                <div>
                  {isDragReject ? (
                    <p className="text-lg font-medium text-destructive">
                      Invalid file type
                    </p>
                  ) : isDragActive ? (
                    <p className="text-lg font-medium text-primary">
                      Drop video files here
                    </p>
                  ) : (
                    <>
                      <p className="text-lg font-medium mb-1">
                        Drag and drop video files here
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse
                      </p>
                    </>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Supported formats: MP4, WebM, MOV, AVI, MKV</p>
                  <p>Maximum file size: {formatFileSize(maxSize)}</p>
                  <p>Maximum files: {maxFiles}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span>{files.length} file(s)</span>
              {pendingCount > 0 && (
                <Badge variant="secondary">{pendingCount} pending</Badge>
              )}
              {uploadingCount > 0 && (
                <Badge>{uploadingCount} uploading</Badge>
              )}
              {completedCount > 0 && (
                <Badge className="bg-green-500">{completedCount} completed</Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive">{errorCount} failed</Badge>
              )}
            </div>

            <div className="flex gap-2">
              {completedCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearCompleted}
                >
                  Clear Completed
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={open}
              >
                <Upload className="h-4 w-4 mr-2" />
                Add More
              </Button>
              {pendingCount > 0 && (
                <Button
                  size="sm"
                  onClick={handleUploadAll}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload All ({pendingCount})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Files */}
          <div className="space-y-2">
            {files.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    {getStatusIcon(file.status)}

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{file.name}</p>
                        {getStatusBadge(file.status)}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        {file.metadata && (
                          <>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(file.metadata.duration)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Maximize2 className="h-3 w-3" />
                              {file.metadata.width}×{file.metadata.height}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {getQualityLabel(file.metadata.width, file.metadata.height)}
                            </Badge>
                          </>
                        )}
                        {file.status === 'uploading' && (
                          <span>{file.progress}%</span>
                        )}
                        {file.status === 'error' && file.error && (
                          <span className="text-destructive">{file.error}</span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {(file.status === 'uploading' || file.status === 'processing') && (
                        <Progress
                          value={file.progress}
                          className="h-1 mt-2"
                        />
                      )}
                    </div>

                    {/* Actions */}
                    {file.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
