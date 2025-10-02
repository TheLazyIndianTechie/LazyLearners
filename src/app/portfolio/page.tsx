"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { SiteLayout } from "@/components/layout/site-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Filter,
  Heart,
  Eye,
  ExternalLink,
  Github,
  Play,
  Download,
  Calendar,
  User,
  Trophy,
  Gamepad2
} from "lucide-react"
import { ProjectCategory, GameEngine, PortfolioProject } from "@/lib/types/portfolio"

// Mock portfolio data - replace with real API call
const mockProjects: PortfolioProject[] = [
  {
    id: "1",
    title: "Space Explorer VR",
    description: "An immersive VR experience where players explore alien planets and discover ancient civilizations. Features realistic physics, dynamic weather systems, and procedurally generated landscapes.",
    shortDescription: "Immersive VR space exploration with procedural planets",
    thumbnail: "/api/placeholder/400/300",
    screenshots: ["/api/placeholder/800/600", "/api/placeholder/800/600"],
    category: "vr_ar",
    engine: "unity",
    tags: ["VR", "Space", "Exploration", "Physics"],
    playableUrl: "https://example.com/play",
    sourceCodeUrl: "https://github.com/example/space-explorer",
    downloadUrl: "https://example.com/download",
    developmentTime: "6 months",
    teamSize: 1,
    myRole: "Solo Developer",
    challenges: "Optimizing VR performance while maintaining visual quality",
    learnings: "Advanced VR development techniques and spatial audio implementation",
    technologies: ["Unity 3D", "C#", "Oculus SDK", "HLSL"],
    features: ["Hand Tracking", "Spatial Audio", "Procedural Generation", "Physics Simulation"],
    isPublic: true,
    isFeatured: true,
    completedAt: new Date("2024-11-15"),
    createdAt: new Date("2024-11-16"),
    updatedAt: new Date("2024-11-16"),
    userId: "user1",
    courseId: "course1",
    likes: 128,
    views: 1542,
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    demoImages: ["/api/placeholder/400/300", "/api/placeholder/400/300"]
  },
  {
    id: "2",
    title: "Pixel Dungeon Crawler",
    description: "A retro-style dungeon crawler with pixel art graphics, turn-based combat, and procedurally generated levels. Inspired by classic RPGs with modern game design principles.",
    shortDescription: "Retro pixel art dungeon crawler with turn-based combat",
    thumbnail: "/api/placeholder/400/300",
    screenshots: ["/api/placeholder/800/600"],
    category: "mobile_game",
    engine: "godot",
    tags: ["Pixel Art", "RPG", "Mobile", "Roguelike"],
    playableUrl: "https://example.com/play",
    sourceCodeUrl: "https://github.com/example/pixel-dungeon",
    developmentTime: "4 months",
    teamSize: 2,
    myRole: "Programmer & Game Designer",
    challenges: "Balancing procedural generation with handcrafted level design",
    learnings: "Mobile optimization and touch controls implementation",
    technologies: ["Godot", "GDScript", "Aseprite", "AudioTool"],
    features: ["Procedural Levels", "Turn-based Combat", "Inventory System", "Character Progression"],
    isPublic: true,
    isFeatured: false,
    completedAt: new Date("2024-10-20"),
    createdAt: new Date("2024-10-21"),
    updatedAt: new Date("2024-10-21"),
    userId: "user2",
    likes: 89,
    views: 856,
    demoImages: ["/api/placeholder/400/300"]
  },
  {
    id: "3",
    title: "Racing Championship",
    description: "High-speed arcade racing game with customizable cars, multiple tracks, and online multiplayer. Features realistic physics and dynamic weather conditions.",
    shortDescription: "Arcade racing game with customizable cars and multiplayer",
    thumbnail: "/api/placeholder/400/300",
    screenshots: ["/api/placeholder/800/600"],
    category: "desktop_game",
    engine: "unreal",
    tags: ["Racing", "Multiplayer", "3D", "Cars"],
    playableUrl: "https://example.com/play",
    downloadUrl: "https://example.com/download",
    developmentTime: "8 months",
    teamSize: 4,
    myRole: "Lead Programmer",
    challenges: "Implementing smooth multiplayer with minimal latency",
    learnings: "Network programming and real-time synchronization",
    technologies: ["Unreal Engine", "C++", "Blueprint", "Photon"],
    features: ["Online Multiplayer", "Car Customization", "Dynamic Weather", "Track Editor"],
    isPublic: true,
    isFeatured: true,
    completedAt: new Date("2024-09-10"),
    createdAt: new Date("2024-09-11"),
    updatedAt: new Date("2024-09-11"),
    userId: "user3",
    likes: 245,
    views: 2834,
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    demoImages: ["/api/placeholder/400/300", "/api/placeholder/400/300", "/api/placeholder/400/300"]
  }
]

const CATEGORIES: { value: ProjectCategory; label: string }[] = [
  { value: "mobile_game", label: "Mobile Game" },
  { value: "web_game", label: "Web Game" },
  { value: "desktop_game", label: "Desktop Game" },
  { value: "vr_ar", label: "VR/AR" },
  { value: "prototype", label: "Prototype" },
  { value: "game_jam", label: "Game Jam" },
  { value: "portfolio_piece", label: "Portfolio Piece" },
  { value: "commercial", label: "Commercial" },
  { value: "educational", label: "Educational" },
  { value: "other", label: "Other" }
]

const ENGINES: { value: GameEngine; label: string }[] = [
  { value: "unity", label: "Unity" },
  { value: "unreal", label: "Unreal Engine" },
  { value: "godot", label: "Godot" },
  { value: "construct", label: "Construct" },
  { value: "gamemaker", label: "GameMaker" },
  { value: "custom", label: "Custom Engine" },
  { value: "web_technologies", label: "Web Technologies" },
  { value: "other", label: "Other" }
]

export default function PortfolioPage() {
  const [projects, setProjects] = useState<PortfolioProject[]>(mockProjects)
  const [filteredProjects, setFilteredProjects] = useState<PortfolioProject[]>(mockProjects)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedEngine, setSelectedEngine] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")

  useEffect(() => {
    let filtered = [...projects]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(project => project.category === selectedCategory)
    }

    // Engine filter
    if (selectedEngine !== "all") {
      filtered = filtered.filter(project => project.engine === selectedEngine)
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
        break
      case "most_liked":
        filtered.sort((a, b) => b.likes - a.likes)
        break
      case "most_viewed":
        filtered.sort((a, b) => b.views - a.views)
        break
      case "featured":
        filtered.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
        break
    }

    setFilteredProjects(filtered)
  }, [projects, searchQuery, selectedCategory, selectedEngine, sortBy])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric'
    }).format(date)
  }

  const getCategoryIcon = (category: ProjectCategory) => {
    switch (category) {
      case "vr_ar":
        return "🥽"
      case "mobile_game":
        return "📱"
      case "web_game":
        return "🌐"
      case "desktop_game":
        return "💻"
      case "game_jam":
        return "⚡"
      default:
        return "🎮"
    }
  }

  const getEngineColor = (engine: GameEngine) => {
    switch (engine) {
      case "unity":
        return "bg-black text-white"
      case "unreal":
        return "bg-blue-600 text-white"
      case "godot":
        return "bg-blue-500 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  return (
    <SiteLayout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="w-8 h-8 text-yellow-600" />
            <h1 className="text-4xl font-bold">Student Portfolio</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing games and projects created by our talented students
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild>
              <Link href="/portfolio/create">
                Add Your Project
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/portfolio/my-portfolio">
                My Portfolio
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
              <p className="text-sm text-gray-600">Total Projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {projects.reduce((sum, p) => sum + p.likes, 0)}
              </div>
              <p className="text-sm text-gray-600">Total Likes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {projects.reduce((sum, p) => sum + p.views, 0)}
              </div>
              <p className="text-sm text-gray-600">Total Views</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {projects.filter(p => p.isFeatured).length}
              </div>
              <p className="text-sm text-gray-600">Featured</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search projects, tags, or descriptions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedEngine} onValueChange={setSelectedEngine}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Engines" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Engines</SelectItem>
                      {ENGINES.map((engine) => (
                        <SelectItem key={engine.value} value={engine.value}>
                          {engine.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="most_liked">Most Liked</SelectItem>
                      <SelectItem value="most_viewed">Most Viewed</SelectItem>
                      <SelectItem value="featured">Featured First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Showing {filteredProjects.length} of {projects.length} projects
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Gamepad2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600">Try adjusting your filters or search terms</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src={project.thumbnail}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Overlay badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge className={getEngineColor(project.engine)}>
                      {ENGINES.find(e => e.value === project.engine)?.label}
                    </Badge>
                    {project.isFeatured && (
                      <Badge className="bg-yellow-500 text-white">
                        <Trophy className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>

                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      {getCategoryIcon(project.category)} {CATEGORIES.find(c => c.value === project.category)?.label}
                    </Badge>
                  </div>

                  {/* Action buttons overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {project.playableUrl && (
                      <Button size="sm" asChild>
                        <Link href={project.playableUrl} target="_blank">
                          <Play className="w-4 h-4 mr-1" />
                          Play
                        </Link>
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" asChild>
                      <Link href={`/portfolio/project/${project.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{project.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{project.shortDescription}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(project.completedAt)}</span>
                      <span>•</span>
                      <User className="w-3 h-3" />
                      <span>{project.teamSize === 1 ? "Solo" : `${project.teamSize} people`}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {project.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {project.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{project.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{project.views}</span>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        {project.sourceCodeUrl && (
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={project.sourceCodeUrl} target="_blank">
                              <Github className="w-4 h-4" />
                            </Link>
                          </Button>
                        )}
                        {project.downloadUrl && (
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={project.downloadUrl} target="_blank">
                              <Download className="w-4 h-4" />
                            </Link>
                          </Button>
                        )}
                        {project.playableUrl && (
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={project.playableUrl} target="_blank">
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  )
}