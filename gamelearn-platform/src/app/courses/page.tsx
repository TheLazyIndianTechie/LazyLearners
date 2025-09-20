"use client"

import { useState } from "react"
import { SiteLayout } from "@/components/layout/site-layout"
import { EnhancedCourseCard } from "@/components/course/enhanced-course-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Course } from "@/lib/types"

// Mock data for demonstration
const mockCourses: Course[] = [
  {
    id: "1",
    title: "Complete Unity Game Development Course",
    description: "Learn Unity from scratch and build 10 complete games. Master C# programming, game physics, UI design, and publishing to multiple platforms.",
    thumbnail: "/api/placeholder/400/225",
    instructor: {
      id: "inst-1",
      name: "Alex Johnson",
      email: "alex@gamelearn.com",
      avatar: "/api/placeholder/40/40",
      role: "instructor",
      enrolledCourses: [],
      createdCourses: ["1"],
      portfolio: {} as any,
      certifications: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    category: "unity-development",
    engine: "unity",
    difficulty: "beginner",
    duration: 2400, // 40 hours
    price: 89.99,
    rating: 4.8,
    reviewCount: 1250,
    modules: [],
    requirements: ["Basic computer skills", "Windows or Mac computer"],
    objectives: ["Master Unity interface", "Build complete games", "Publish to app stores"],
    tags: ["Unity", "C#", "Game Development", "Beginner"],
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2",
    title: "Unreal Engine 5 Blueprint Mastery",
    description: "Create stunning games with Unreal Engine 5 using visual scripting. Learn Blueprints, materials, lighting, and advanced game mechanics.",
    thumbnail: "/api/placeholder/400/225",
    instructor: {
      id: "inst-2",
      name: "Sarah Chen",
      email: "sarah@gamelearn.com",
      avatar: "/api/placeholder/40/40",
      role: "instructor",
      enrolledCourses: [],
      createdCourses: ["2"],
      portfolio: {} as any,
      certifications: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    category: "unreal-development",
    engine: "unreal",
    difficulty: "intermediate",
    duration: 1800, // 30 hours
    price: 0, // Free course
    rating: 4.9,
    reviewCount: 890,
    modules: [],
    requirements: ["Unreal Engine 5 installed", "Dedicated graphics card"],
    objectives: ["Master Blueprint system", "Create realistic environments", "Implement game mechanics"],
    tags: ["Unreal Engine", "Blueprints", "Visual Scripting", "3D Games"],
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "3",
    title: "Godot 4 Indie Game Development",
    description: "Build indie games with Godot 4 using GDScript. Learn 2D and 3D game development, node system, and how to optimize for performance.",
    thumbnail: "/api/placeholder/400/225",
    instructor: {
      id: "inst-3",
      name: "Miguel Rodriguez",
      email: "miguel@gamelearn.com",
      avatar: "/api/placeholder/40/40",
      role: "instructor",
      enrolledCourses: [],
      createdCourses: ["3"],
      portfolio: {} as any,
      certifications: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    category: "godot-development",
    engine: "godot",
    difficulty: "beginner",
    duration: 1500, // 25 hours
    price: 49.99,
    rating: 4.7,
    reviewCount: 567,
    modules: [],
    requirements: ["Basic programming knowledge", "Godot 4 installed"],
    objectives: ["Master Godot workflow", "Build 2D and 3D games", "Publish indie games"],
    tags: ["Godot", "GDScript", "Indie Games", "2D", "3D"],
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "4",
    title: "Advanced C++ Game Programming",
    description: "Master game programming with modern C++. Learn engine architecture, memory management, multithreading, and performance optimization.",
    thumbnail: "/api/placeholder/400/225",
    instructor: {
      id: "inst-4",
      name: "David Kim",
      email: "david@gamelearn.com",
      avatar: "/api/placeholder/40/40",
      role: "instructor",
      enrolledCourses: [],
      createdCourses: ["4"],
      portfolio: {} as any,
      certifications: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    category: "game-programming",
    engine: "custom",
    difficulty: "advanced",
    duration: 3600, // 60 hours
    price: 149.99,
    rating: 4.9,
    reviewCount: 432,
    modules: [],
    requirements: ["Strong C++ knowledge", "Computer graphics basics"],
    objectives: ["Build game engines", "Optimize performance", "Advanced programming patterns"],
    tags: ["C++", "Game Engine", "Performance", "Advanced"],
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const categories = [
  { id: "all", label: "All Courses" },
  { id: "unity-development", label: "Unity" },
  { id: "unreal-development", label: "Unreal Engine" },
  { id: "godot-development", label: "Godot" },
  { id: "game-programming", label: "Programming" },
  { id: "game-design", label: "Game Design" },
  { id: "game-art", label: "Game Art" }
]

const difficulties = ["all", "beginner", "intermediate", "advanced"]

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")

  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === "all" || course.difficulty === selectedDifficulty

    return matchesSearch && matchesCategory && matchesDifficulty
  })

  return (
    <SiteLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="space-y-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Game Development Courses</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Master game development with expert-led courses on Unity, Unreal Engine, Godot, and more.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md">
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-6 mb-8">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-7">
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-muted-foreground">Difficulty:</span>
            {difficulties.map((difficulty) => (
              <Badge
                key={difficulty}
                variant={selectedDifficulty === difficulty ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedDifficulty(difficulty)}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <EnhancedCourseCard key={course.id} course={course} />
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No courses found matching your criteria.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                  setSelectedDifficulty("all")
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  )
}