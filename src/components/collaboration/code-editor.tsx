"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Save,
  Download,
  Upload,
  Play,
  Settings,
  MoreVertical,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Users,
  Palette
} from "lucide-react"
import { CollaborationFile, CursorPosition, CodeChange } from "@/lib/types/collaboration"

interface CodeEditorProps {
  files: CollaborationFile[]
  activeFileId: string | null
  cursors: CursorPosition[]
  onFileChange: (fileId: string, content: string) => void
  onCursorMove: (position: CursorPosition) => void
  onFileCreate: (name: string, type: string) => void
  onFileDelete: (fileId: string) => void
  onFileLock: (fileId: string) => void
  onFileUnlock: (fileId: string) => void
  onCodeChange: (change: CodeChange) => void
  currentUserId: string
  canEdit: boolean
  isConnected: boolean
}

const LANGUAGE_OPTIONS = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "csharp", label: "C#" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "markdown", label: "Markdown" }
]

const FILE_TYPES = [
  { value: "code", label: "Code File" },
  { value: "text", label: "Text File" },
  { value: "markdown", label: "Markdown" },
  { value: "config", label: "Config File" }
]

const CURSOR_COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // green
  "#F59E0B", // yellow
  "#8B5CF6", // purple
  "#F97316", // orange
  "#06B6D4", // cyan
  "#84CC16"  // lime
]

export function CodeEditor({
  files,
  activeFileId,
  cursors,
  onFileChange,
  onCursorMove,
  onFileCreate,
  onFileDelete,
  onFileLock,
  onFileUnlock,
  onCodeChange,
  currentUserId,
  canEdit,
  isConnected
}: CodeEditorProps) {
  const [newFileName, setNewFileName] = useState("")
  const [newFileType, setNewFileType] = useState("code")
  const [showCreateFile, setShowCreateFile] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  const [theme, setTheme] = useState("light")
  const [wordWrap, setWordWrap] = useState(true)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [showCursors, setShowCursors] = useState(true)

  const editorRef = useRef<HTMLTextAreaElement>(null)
  const cursorPositionRef = useRef<{ line: number; column: number }>({ line: 0, column: 0 })

  const activeFile = files.find(f => f.id === activeFileId)

  const handleContentChange = useCallback((content: string) => {
    if (!activeFileId || !canEdit || !isConnected) return

    onFileChange(activeFileId, content)

    // Create a code change event
    const change: CodeChange = {
      id: `change-${Date.now()}`,
      sessionId: "", // Will be set by the parent component
      userId: currentUserId,
      operation: "replace",
      position: {
        line: cursorPositionRef.current.line,
        column: cursorPositionRef.current.column
      },
      content,
      timestamp: new Date(),
      isReverted: false
    }

    onCodeChange(change)
  }, [activeFileId, canEdit, isConnected, currentUserId, onFileChange, onCodeChange])

  const handleCursorMove = useCallback((event: React.MouseEvent | React.KeyboardEvent) => {
    if (!activeFileId || !editorRef.current) return

    const textarea = editorRef.current
    const cursorPosition = textarea.selectionStart
    const textBeforeCursor = textarea.value.substring(0, cursorPosition)
    const lines = textBeforeCursor.split('\n')
    const line = lines.length
    const column = lines[lines.length - 1].length + 1

    cursorPositionRef.current = { line, column }

    const position: CursorPosition = {
      userId: currentUserId,
      sessionId: "", // Will be set by parent
      fileId: activeFileId,
      line,
      column,
      timestamp: new Date()
    }

    onCursorMove(position)
  }, [activeFileId, currentUserId, onCursorMove])

  const handleCreateFile = () => {
    if (!newFileName.trim()) return

    onFileCreate(newFileName.trim(), newFileType)
    setNewFileName("")
    setShowCreateFile(false)
  }

  const handleRunCode = async () => {
    if (!activeFile) return

    try {
      // Note: Direct code execution is disabled for security reasons
      // In a production environment, code execution should be handled via:
      // - Sandboxed Web Workers with strict Content Security Policy
      // - Server-side execution in isolated containers
      // - Third-party code execution services (e.g., Judge0, CodeSandbox API)

      console.log("Code Preview:", activeFile.name)
      console.log(`Language: ${activeFile.language}`)
      console.log(`Lines: ${activeFile.content.split('\n').length}`)
      console.log(`Characters: ${activeFile.content.length}`)

      // Show a user-friendly message instead of executing code
      alert(`Code execution is currently disabled for security.\n\nFile: ${activeFile.name}\nLanguage: ${activeFile.language}\n\nTo run this code, please use an external IDE or code runner.`)

      console.log("ℹ️ Code execution disabled for security - use external IDE to run code")
    } catch (error) {
      console.error("❌ Code preview failed:", error)
    }
  }

  const handleSaveFile = async () => {
    if (!activeFile) return

    try {
      // Save file to collaboration session
      const saveData = {
        fileId: activeFile.id,
        name: activeFile.name,
        content: activeFile.content,
        language: activeFile.language,
        version: (activeFile.version || 0) + 1,
        lastModified: new Date().toISOString()
      }

      // In a real implementation, this would save to the server
      console.log("💾 File saved successfully:", activeFile.name)

      // Update local file version
      activeFile.version = saveData.version

      // Show success notification
      console.log(`✅ ${activeFile.name} saved (v${saveData.version})`)
    } catch (error) {
      console.error("❌ Failed to save file:", error)
    }
  }

  const handleDownloadFile = () => {
    if (!activeFile) return

    const blob = new Blob([activeFile.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = activeFile.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getCursorColor = (userId: string, index: number) => {
    return CURSOR_COLORS[index % CURSOR_COLORS.length]
  }

  const renderCursors = () => {
    if (!showCursors || !activeFileId) return null

    return cursors
      .filter(cursor => cursor.fileId === activeFileId && cursor.userId !== currentUserId)
      .map((cursor, index) => (
        <div
          key={cursor.userId}
          className="absolute pointer-events-none"
          style={{
            left: `${cursor.column * 8}px`, // Approximate character width
            top: `${(cursor.line - 1) * 20}px`, // Approximate line height
            borderLeft: `2px solid ${getCursorColor(cursor.userId, index)}`,
            height: "20px"
          }}
        >
          <div
            className="absolute -top-5 -left-1 px-1 py-0.5 text-xs text-white rounded text-nowrap"
            style={{ backgroundColor: getCursorColor(cursor.userId, index) }}
          >
            User {cursor.userId.slice(-4)}
          </div>
        </div>
      ))
  }

  const renderLineNumbers = () => {
    if (!showLineNumbers || !activeFile) return null

    const lines = activeFile.content.split('\n')
    return (
      <div className="flex flex-col text-xs text-slate-500 pr-3 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        {lines.map((_, index) => (
          <div key={index} className="h-5 flex items-center justify-end px-2">
            {index + 1}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          {/* File tabs */}
          <div className="flex gap-1">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => !file.isLocked && onFileChange && onFileChange(file.id, file.content)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-t border-b-2 transition-colors ${
                  file.id === activeFileId
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent"
                }`}
                disabled={file.isLocked && file.lockedBy !== currentUserId}
              >
                <span>{file.name}</span>
                {file.isLocked && (
                  <Lock className="w-3 h-3 text-slate-500" />
                )}
                {file.id === activeFileId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                        <MoreVertical className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleSaveFile}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDownloadFile}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => file.isLocked ? onFileUnlock(file.id) : onFileLock(file.id)}
                        disabled={file.isLocked && file.lockedBy !== currentUserId}
                      >
                        {file.isLocked ? (
                          <>
                            <Unlock className="w-4 h-4 mr-2" />
                            Unlock
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Lock
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onFileDelete(file.id)}
                        className="text-red-600"
                        disabled={file.isLocked && file.lockedBy !== currentUserId}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </button>
            ))}

            {/* Create file button */}
            {showCreateFile ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded">
                <Input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="filename.ext"
                  className="h-6 text-xs"
                  onKeyPress={(e) => e.key === "Enter" && handleCreateFile()}
                  autoFocus
                />
                <Select value={newFileType} onValueChange={setNewFileType}>
                  <SelectTrigger className="h-6 w-20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleCreateFile}>
                  Create
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowCreateFile(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreateFile(true)}
                disabled={!canEdit}
              >
                + New File
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector */}
          {activeFile && (
            <Select value={activeFile.language || "javascript"} onValueChange={() => {}}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Run button */}
          <Button size="sm" onClick={handleRunCode} disabled={!activeFile} className="gap-2">
            <Play className="w-4 h-4" />
            Run
          </Button>

          {/* View options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowLineNumbers(!showLineNumbers)}>
                {showLineNumbers ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showLineNumbers ? "Hide" : "Show"} Line Numbers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCursors(!showCursors)}>
                <Users className="w-4 h-4 mr-2" />
                {showCursors ? "Hide" : "Show"} Cursors
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                <Palette className="w-4 h-4 mr-2" />
                {theme === "light" ? "Dark" : "Light"} Theme
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-sm">
                Font Size: {fontSize}px
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Connection status */}
          <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
            {isConnected ? "Connected" : "Offline"}
          </Badge>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden">
        {activeFile ? (
          <>
            {/* Line numbers */}
            {showLineNumbers && renderLineNumbers()}

            {/* Code editor */}
            <div className="flex-1 relative">
              <textarea
                ref={editorRef}
                value={activeFile.content}
                onChange={(e) => handleContentChange(e.target.value)}
                onMouseUp={handleCursorMove}
                onKeyUp={handleCursorMove}
                className={`w-full h-full p-4 font-mono text-sm bg-transparent border-none outline-none resize-none ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                } ${!canEdit || (activeFile.isLocked && activeFile.lockedBy !== currentUserId)
                  ? "cursor-not-allowed opacity-50" : ""
                }`}
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: "1.5",
                  wordWrap: wordWrap ? "break-word" : "normal",
                  whiteSpace: wordWrap ? "pre-wrap" : "pre"
                }}
                disabled={!canEdit || (activeFile.isLocked && activeFile.lockedBy !== currentUserId)}
                spellCheck={false}
              />

              {/* Cursor overlays */}
              {renderCursors()}

              {/* File lock indicator */}
              {activeFile.isLocked && activeFile.lockedBy !== currentUserId && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                      <Lock className="w-5 h-5" />
                      <span className="font-semibold">File Locked</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      This file is currently being edited by another user.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold mb-2">No File Selected</h3>
              <p className="mb-4">Create a new file or select an existing one to start coding</p>
              <Button onClick={() => setShowCreateFile(true)} disabled={!canEdit}>
                Create New File
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          {activeFile && (
            <>
              <span>Line {cursorPositionRef.current.line}, Column {cursorPositionRef.current.column}</span>
              <span>•</span>
              <span>{activeFile.content.length} characters</span>
              <span>•</span>
              <span>{activeFile.content.split('\n').length} lines</span>
              {activeFile.language && (
                <>
                  <span>•</span>
                  <span className="capitalize">{activeFile.language}</span>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span>Version {activeFile?.version || 1}</span>
          {activeFile?.isLocked && (
            <Badge variant="outline" className="text-xs">
              Locked by {activeFile.lockedBy === currentUserId ? "You" : "Other User"}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}