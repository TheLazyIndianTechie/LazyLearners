"use client"

import { useState, useEffect, useMemo } from "react"
import { SiteLayout } from "@/components/layout/site-layout"
import { EnhancedCourseCard } from "@/components/course/enhanced-course-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Course } from "@/lib/types"
import {
  Search,
  Filter,
  Grid,
  List,
  Star,
  Clock,
  DollarSign,
  Users,
  BookOpen,
  Play,
  SlidersHorizontal,
  TrendingUp,
  Award,
  ChevronDown,
  X
} from "lucide-react"

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
  },
  {
    id: "5",
    title: "Mobile Game Development with Unity",
    description: "Create mobile games for iOS and Android using Unity. Learn touch controls, monetization, performance optimization, and app store publishing.",
    thumbnail: "/api/placeholder/400/225",
    instructor: {
      id: "inst-1",
      name: "Alex Johnson",
      email: "alex@gamelearn.com",
      avatar: "/api/placeholder/40/40",
      role: "instructor",
      enrolledCourses: [],
      createdCourses: ["1", "5"],
      portfolio: {} as any,
      certifications: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    category: "mobile-games",
    engine: "unity",
    difficulty: "intermediate",
    duration: 2000,
    price: 69.99,
    rating: 4.6,
    reviewCount: 743,
    modules: [],
    requirements: ["Unity basics", "Mobile device for testing"],
    objectives: ["Build mobile games", "Implement touch controls", "Publish to app stores"],
    tags: ["Unity", "Mobile", "iOS", "Android", "Touch Controls"],
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "6",
    title: "Game Design Fundamentals",
    description: "Learn the principles of game design, player psychology, level design, and balancing. Create compelling gameplay experiences that engage players.",
    thumbnail: "/api/placeholder/400/225",
    instructor: {
      id: "inst-5",
      name: "Emma Wilson",
      email: "emma@gamelearn.com",
      avatar: "/api/placeholder/40/40",
      role: "instructor",
      enrolledCourses: [],
      createdCourses: ["6"],
      portfolio: {} as any,
      certifications: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    category: "game-design",
    engine: "custom",
    difficulty: "beginner",
    duration: 1200,
    price: 39.99,
    rating: 4.8,
    reviewCount: 456,
    modules: [],
    requirements: ["Interest in game design", "Basic understanding of games"],
    objectives: ["Understand game design principles", "Create engaging gameplay", "Design balanced systems"],
    tags: ["Game Design", "Level Design", "Psychology", "Mechanics"],
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const categories = [
  { id: "all", label: "All Courses", icon: BookOpen },
  { id: "unity-development", label: "Unity", icon: Play },
  { id: "unreal-development", label: "Unreal Engine", icon: Play },
  { id: "godot-development", label: "Godot", icon: Play },
  { id: "game-programming", label: "Programming", icon: BookOpen },
  { id: "game-design", label: "Game Design", icon: Award },
  { id: "mobile-games", label: "Mobile Games", icon: Users }
]

const difficultyLevels = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" }
]

const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "duration", label: "Duration" }
]

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 200])
  const [durationRange, setDurationRange] = useState([0, 60])
  const [selectedEngines, setSelectedEngines] = useState<string[]>([])
  const [onlyFree, setOnlyFree] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [sortBy, setSortBy] = useState("popular")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)

  const engines = ["unity", "unreal", "godot", "custom"]

  const filteredAndSortedCourses = useMemo(() => {
    let filtered = mockCourses.filter(course => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = selectedCategory === "all" || course.category === selectedCategory
      const matchesDifficulty = selectedDifficulty === "all" || course.difficulty === selectedDifficulty
      const matchesPrice = onlyFree ? course.price === 0 : course.price >= priceRange[0] && course.price <= priceRange[1]
      const matchesDuration = course.duration >= durationRange[0] * 60 && course.duration <= durationRange[1] * 60
      const matchesEngine = selectedEngines.length === 0 || selectedEngines.includes(course.engine)
      const matchesRating = course.rating >= minRating

      return matchesSearch && matchesCategory && matchesDifficulty && matchesPrice &&
             matchesDuration && matchesEngine && matchesRating
    })

    // Sort courses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "duration":
          return a.duration - b.duration
        case "popular":
        default:
          return b.reviewCount - a.reviewCount
      }
    })

    return filtered
  }, [searchQuery, selectedCategory, selectedDifficulty, priceRange, durationRange,
      selectedEngines, onlyFree, minRating, sortBy])

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedDifficulty("all")
    setPriceRange([0, 200])
    setDurationRange([0, 60])
    setSelectedEngines([])
    setOnlyFree(false)
    setMinRating(0)
    setSortBy("popular")
  }

  const hasActiveFilters = selectedCategory !== "all" || selectedDifficulty !== "all" ||
                          selectedEngines.length > 0 || onlyFree || minRating > 0 ||
                          priceRange[0] > 0 || priceRange[1] < 200 ||
                          durationRange[0] > 0 || durationRange[1] < 60

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

          {/* Featured Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(1).map((category) => {
              const IconComponent = category.icon
              const courseCount = mockCourses.filter(c => c.category === category.id).length

              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all hover:shadow-md min-h-[80px] ${
                    selectedCategory === category.id ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedCategory(category.id)
                    }
                  }}
                  aria-label={`Filter by ${category.label}`}
                >
                  <CardContent className="p-4 text-center">
                    <IconComponent className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-medium text-sm sm:text-base">{category.label}</h3>
                    <p className="text-xs text-muted-foreground">{courseCount} courses</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses, instructors, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48 min-h-[44px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="min-h-[44px]">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="destructive" className="ml-2 h-4 w-4 rounded-full p-0 text-xs">
                        !
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filter Courses</SheetTitle>
                    <SheetDescription>
                      Refine your search to find the perfect course
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-6 mt-6">
                    {/* Difficulty */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Difficulty Level</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {difficultyLevels.map((level) => (
                          <Button
                            key={level.value}
                            variant={selectedDifficulty === level.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedDifficulty(level.value)}
                            className="justify-start min-h-[44px]"
                          >
                            {level.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium">Price Range</Label>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={onlyFree}
                            onCheckedChange={setOnlyFree}
                          />
                          <Label className="text-sm">Free only</Label>
                        </div>
                      </div>
                      {!onlyFree && (
                        <div className="space-y-2">
                          <Slider
                            value={priceRange}
                            onValueChange={setPriceRange}
                            max={200}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>${priceRange[0]}</span>
                            <span>${priceRange[1]}+</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Duration */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Course Duration (hours)</Label>
                      <div className="space-y-2">
                        <Slider
                          value={durationRange}
                          onValueChange={setDurationRange}
                          max={60}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{durationRange[0]}h</span>
                          <span>{durationRange[1]}h+</span>
                        </div>
                      </div>
                    </div>

                    {/* Game Engines */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Game Engines</Label>
                      <div className="space-y-2">
                        {engines.map((engine) => (
                          <div key={engine} className="flex items-center space-x-2">
                            <Checkbox
                              checked={selectedEngines.includes(engine)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedEngines([...selectedEngines, engine])
                                } else {
                                  setSelectedEngines(selectedEngines.filter(e => e !== engine))
                                }
                              }}
                            />
                            <Label className="text-sm capitalize">{engine === "custom" ? "Custom/Other" : engine}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rating */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Minimum Rating</Label>
                      <div className="space-y-2">
                        <Slider
                          value={[minRating]}
                          onValueChange={([value]) => setMinRating(value)}
                          max={5}
                          step={0.5}
                          className="w-full"
                        />
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{minRating}+ stars</span>
                        </div>
                      </div>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        onClick={clearAllFilters}
                        className="w-full min-h-[44px]"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* View Mode Toggle */}
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none min-h-[44px] min-w-[44px]"
                  aria-label="Grid view"
                >
                  <Grid className="h-5 w-5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none min-h-[44px] min-w-[44px]"
                  aria-label="List view"
                >
                  <List className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {categories.find(c => c.id === selectedCategory)?.label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
                </Badge>
              )}
              {selectedDifficulty !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {difficultyLevels.find(d => d.value === selectedDifficulty)?.label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedDifficulty("all")} />
                </Badge>
              )}
              {onlyFree && (
                <Badge variant="secondary" className="gap-1">
                  Free only
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setOnlyFree(false)} />
                </Badge>
              )}
              {selectedEngines.map(engine => (
                <Badge key={engine} variant="secondary" className="gap-1">
                  {engine.charAt(0).toUpperCase() + engine.slice(1)}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedEngines(selectedEngines.filter(e => e !== engine))}
                  />
                </Badge>
              ))}
              {minRating > 0 && (
                <Badge variant="secondary" className="gap-1">
                  {minRating}+ stars
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setMinRating(0)} />
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-lg font-medium">
              {filteredAndSortedCourses.length} course{filteredAndSortedCourses.length !== 1 ? 's' : ''} found
            </p>
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                Results for "{searchQuery}"
              </p>
            )}
          </div>
        </div>

        {/* Course Grid/List */}
        {filteredAndSortedCourses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria or browse our featured categories above.
              </p>
              <Button onClick={clearAllFilters} className="min-h-[44px]">
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }>
            {filteredAndSortedCourses.map((course) => (
              <div key={course.id}>
                {viewMode === "grid" ? (
                  <EnhancedCourseCard course={course} />
                ) : (
                  <Card className="overflow-hidden">
                    <div className="flex">
                      <img
                        src={course.thumbnail || '/placeholder-course.jpg'}
                        alt={course.title}
                        className="w-32 sm:w-40 md:w-48 h-24 sm:h-28 md:h-32 object-cover"
                      />
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg sm:text-xl font-semibold line-clamp-1">{course.title}</h3>
                          <div className="text-right">
                            {course.price === 0 ? (
                              <Badge variant="secondary">Free</Badge>
                            ) : (
                              <p className="text-lg font-bold">${course.price}</p>
                            )}
                          </div>
                        </div>
                        <p className="text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{course.rating}</span>
                              <span>({course.reviewCount})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{Math.round(course.duration / 60)}h</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{course.instructor.name}</span>
                            </div>
                          </div>
                          <Button className="min-h-[44px]">View Course</Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  )
}