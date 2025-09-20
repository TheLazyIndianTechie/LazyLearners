"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MapPin,
  Globe,
  Github,
  Twitter,
  Linkedin,
  MessageSquare,
  Calendar,
  Users,
  Eye,
  Heart,
  Star,
  Briefcase,
  Filter,
  Grid3X3,
  List
} from "lucide-react"

// Mock data - replace with actual API call
const mockProfile = {
  id: "user1",
  userId: "user1",
  displayName: "Alex Chen",
  bio: "Passionate game developer specializing in cyberpunk aesthetics and immersive experiences. I love creating games that tell meaningful stories through interactive mechanics.",
  avatar: "/api/placeholder/120/120",
  coverImage: "/api/placeholder/1200/300",
  location: "San Francisco, CA",
  website: "https://alexchen.dev",
  socialLinks: {
    twitter: "https://twitter.com/alexchen_dev",
    linkedin: "https://linkedin.com/in/alexchen",
    github: "https://github.com/alexchen",
    discord: "alexchen#1234"
  },

  skills: ["Unity", "C#", "Blender", "Shader Programming", "UI/UX Design", "Game Design"],
  experienceLevel: "intermediate" as const,
  specializations: ["Mobile Games", "Indie Development", "Visual Effects"],
  availableForWork: true,

  isPublic: true,
  showEmail: false,
  showProjects: true,

  totalProjects: 12,
  totalLikes: 1453,
  totalViews: 8901,
  joinedAt: new Date("2023-06-15"),

  createdAt: new Date("2023-06-15"),
  updatedAt: new Date("2024-01-20")
}

const mockProjects = [
  {
    id: "1",
    title: "Neon Runner",
    shortDescription: "Cyberpunk endless runner",
    thumbnail: "/api/placeholder/300/200",
    category: "mobile_game",
    engine: "unity",
    tags: ["cyberpunk", "mobile"],
    likes: 234,
    views: 1250,
    isFeatured: true,
    completedAt: new Date("2024-01-15")
  },
  {
    id: "2",
    title: "Space Defender VR",
    shortDescription: "VR tower defense game",
    thumbnail: "/api/placeholder/300/200",
    category: "vr_ar",
    engine: "unity",
    tags: ["vr", "tower-defense"],
    likes: 189,
    views: 892,
    isFeatured: false,
    completedAt: new Date("2023-11-20")
  },
  {
    id: "3",
    title: "Puzzle Quest 2D",
    shortDescription: "Retro-style puzzle platformer",
    thumbnail: "/api/placeholder/300/200",
    category: "web_game",
    engine: "godot",
    tags: ["puzzle", "retro"],
    likes: 156,
    views: 743,
    isFeatured: false,
    completedAt: new Date("2023-09-10")
  },
  {
    id: "4",
    title: "Racing Championship",
    shortDescription: "3D racing simulator",
    thumbnail: "/api/placeholder/300/200",
    category: "desktop_game",
    engine: "unreal",
    tags: ["racing", "3d"],
    likes: 298,
    views: 1567,
    isFeatured: true,
    completedAt: new Date("2023-12-05")
  }
]

export default function UserPortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"newest" | "most_liked" | "featured">("newest")

  const filteredProjects = mockProjects
    .filter(project => !filterTag || project.tags.includes(filterTag))
    .sort((a, b) => {
      switch (sortBy) {
        case "most_liked":
          return b.likes - a.likes
        case "featured":
          return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)
        case "newest":
        default:
          return b.completedAt.getTime() - a.completedAt.getTime()
      }
    })

  const allTags = Array.from(new Set(mockProjects.flatMap(p => p.tags)))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80">
        <img
          src={mockProfile.coverImage}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-white dark:border-slate-700">
              <AvatarImage src={mockProfile.avatar} alt={mockProfile.displayName} />
              <AvatarFallback className="text-2xl">{mockProfile.displayName.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {mockProfile.displayName}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {mockProfile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{mockProfile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {mockProfile.joinedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    {mockProfile.availableForWork && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Available for work
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Contact
                  </Button>
                  <Button variant="outline" size="sm">
                    <Users className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-2xl">
                {mockProfile.bio}
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {mockProfile.website && (
                  <a
                    href={mockProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
                {mockProfile.socialLinks.github && (
                  <a
                    href={mockProfile.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {mockProfile.socialLinks.twitter && (
                  <a
                    href={mockProfile.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {mockProfile.socialLinks.linkedin && (
                  <a
                    href={mockProfile.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {mockProfile.totalProjects}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Projects</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {mockProfile.totalLikes.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Likes</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {mockProfile.totalViews.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Views</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {mockProfile.experienceLevel}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Level</div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="projects" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="projects">Projects ({mockProfile.totalProjects})</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            {/* Filters and View Controls */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium">Filter by tag:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={filterTag === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterTag(null)}
                    >
                      All
                    </Button>
                    {allTags.map(tag => (
                      <Button
                        key={tag}
                        variant={filterTag === tag ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterTag(tag)}
                      >
                        #{tag}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="newest">Newest</option>
                    <option value="most_liked">Most Liked</option>
                    <option value="featured">Featured</option>
                  </select>

                  <div className="flex border border-slate-300 dark:border-slate-600 rounded-md overflow-hidden">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-none border-0"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-none border-0 border-l border-slate-300 dark:border-slate-600"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Grid/List */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <div className="relative">
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {project.isFeatured && (
                        <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-900">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        {project.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {project.shortDescription}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                        {project.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            <span>{project.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{project.views}</span>
                          </div>
                        </div>
                        <span>{project.completedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                              {project.title}
                              {project.isFeatured && (
                                <Star className="w-4 h-4 text-yellow-500 inline ml-2" />
                              )}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                              {project.shortDescription}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {project.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                            <div className="flex items-center gap-3 mb-1">
                              <div className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                <span>{project.likes}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>{project.views}</span>
                              </div>
                            </div>
                            <span>{project.completedAt.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="about">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-xl font-semibold mb-4">About {mockProfile.displayName}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                {mockProfile.bio}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Experience Level
                  </h4>
                  <Badge variant="outline" className="capitalize">
                    {mockProfile.experienceLevel}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {mockProfile.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-xl font-semibold mb-4">Skills & Technologies</h3>
              <div className="flex flex-wrap gap-3">
                {mockProfile.skills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-sm py-2 px-3">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}