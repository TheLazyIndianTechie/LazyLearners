"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Menu,
  X,
  ChevronLeft,
  Settings,
  BookOpen,
  GraduationCap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CoursePlayerLayoutProps {
  courseId: string
  courseTitle: string
  courseProgress?: number
  sidebar: React.ReactNode
  children: React.ReactNode
  onBackToCourse?: () => void
  className?: string
}

export function CoursePlayerLayout({
  courseId,
  courseTitle,
  courseProgress = 0,
  sidebar,
  children,
  onBackToCourse,
  className
}: CoursePlayerLayoutProps) {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(false)

  // Load autoplay preference from localStorage
  useEffect(() => {
    const savedAutoplay = localStorage.getItem('autoplay-enabled')
    setIsAutoplayEnabled(savedAutoplay === 'true')
  }, [])

  // Keyboard shortcuts for sidebar toggle
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      // Toggle sidebar with [ and ] keys
      if (e.key === '[' || e.key === ']') {
        e.preventDefault()
        setIsSidebarOpen(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyboard)
    return () => document.removeEventListener('keydown', handleKeyboard)
  }, [])

  const handleBackToCourse = () => {
    if (onBackToCourse) {
      onBackToCourse()
    } else {
      router.push(`/courses/${courseId}`)
    }
  }

  const toggleAutoplay = () => {
    const newValue = !isAutoplayEnabled
    setIsAutoplayEnabled(newValue)
    localStorage.setItem('autoplay-enabled', newValue.toString())
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Fixed Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 px-4">
          {/* Mobile Menu Toggle */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Toggle sidebar">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
              <div className="h-full overflow-y-auto">
                {sidebar}
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setIsSidebarOpen(prev => !prev)}
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Back to Course */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToCourse}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Course</span>
          </Button>

          {/* Course Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-semibold truncate">
              {courseTitle}
            </h1>
          </div>

          {/* Course Progress */}
          {courseProgress > 0 && (
            <div className="hidden lg:flex items-center gap-3 min-w-[200px]">
              <div className="flex-1">
                <Progress value={courseProgress} className="h-2" />
              </div>
              <span className="text-sm font-medium tabular-nums">
                {Math.round(courseProgress)}%
              </span>
            </div>
          )}

          {/* Settings Dropdown */}
          <div className="flex items-center gap-2">
            {/* Autoplay Toggle */}
            <Button
              variant={isAutoplayEnabled ? "default" : "ghost"}
              size="sm"
              onClick={toggleAutoplay}
              className="hidden sm:flex gap-2"
              title={`Autoplay: ${isAutoplayEnabled ? 'On' : 'Off'}`}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">
                Autoplay {isAutoplayEnabled ? 'On' : 'Off'}
              </span>
            </Button>

            {/* Certificate Link (if course completed) */}
            {courseProgress >= 100 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => router.push(`/courses/${courseId}/certificate`)}
              >
                <GraduationCap className="h-4 w-4" />
                <span className="hidden md:inline">Certificate</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Progress Bar */}
        {courseProgress > 0 && (
          <div className="lg:hidden px-4 pb-3">
            <div className="flex items-center gap-2">
              <Progress value={courseProgress} className="h-2 flex-1" />
              <span className="text-xs font-medium tabular-nums">
                {Math.round(courseProgress)}%
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-64px)]">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden md:block border-r bg-card transition-all duration-300 overflow-y-auto",
            isSidebarOpen ? "w-[300px] lg:w-[350px]" : "w-0"
          )}
        >
          {isSidebarOpen && (
            <div className="h-full">
              {sidebar}
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container px-4 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="fixed bottom-4 right-4 hidden xl:block">
        <div className="bg-muted/50 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground">
          Press <kbd className="px-2 py-1 bg-background rounded border">?</kbd> for shortcuts
        </div>
      </div>
    </div>
  )
}
