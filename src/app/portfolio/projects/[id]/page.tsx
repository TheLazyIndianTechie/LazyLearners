"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Play,
  Code,
  Download,
  Heart,
  Share2,
  Flag,
  Calendar,
  Users,
  Clock,
  Eye,
  Star,
  ExternalLink,
  Github
} from "lucide-react"
import { VideoPlayer } from "@/components/video/video-player"

// Mock data - replace with actual API call
const mockProject = {
  id: "1",
  title: "Neon Runner - Cyberpunk Endless Runner",
  description: "An immersive cyberpunk-themed endless runner game with dynamic lighting effects and synthwave soundtrack. Players navigate through a futuristic cityscape while collecting power-ups and avoiding obstacles.",
  shortDescription: "Cyberpunk endless runner with neon aesthetics",
  thumbnail: "/api/placeholder/800/400",
  screenshots: [
    "/api/placeholder/800/400",
    "/api/placeholder/800/400",
    "/api/placeholder/800/400",
    "/api/placeholder/800/400"
  ],
  category: "mobile_game" as const,
  engine: "unity" as const,
  tags: ["cyberpunk", "endless-runner", "mobile", "neon", "synthwave"],

  playableUrl: "https://example.com/play",
  sourceCodeUrl: "https://github.com/user/neon-runner",
  downloadUrl: "https://example.com/download",

  developmentTime: "3 months",
  teamSize: 2,
  myRole: "Lead Developer & Game Designer",
  challenges: "Creating smooth infinite scrolling mechanics and optimizing performance for mobile devices while maintaining visual quality.",
  learnings: "Gained deep understanding of object pooling, shader programming, and mobile optimization techniques.",

  technologies: ["Unity", "C#", "Shader Graph", "ProBuilder", "Firebase"],
  features: ["Infinite scrolling", "Dynamic lighting", "Power-up system", "Leaderboards", "Achievement system"],

  isPublic: true,
  isFeatured: true,
  completedAt: new Date("2024-01-15"),
  createdAt: new Date("2023-10-15"),
  updatedAt: new Date("2024-01-20"),

  userId: "user1",
  courseId: "course1",
  likes: 234,
  views: 1250,

  videoUrl: "https://www.youtube.com/watch?v=XtQMytORBmM",
  demoImages: ["/api/placeholder/400/300", "/api/placeholder/400/300"],

  user: {
    id: "user1",
    name: "Alex Chen",
    avatar: "/api/placeholder/40/40",
    bio: "Game developer passionate about cyberpunk aesthetics"
  },

  comments: [
    {
      id: "1",
      content: "Amazing visual effects! The neon lighting is absolutely stunning.",
      user: { name: "Sarah J.", avatar: "/api/placeholder/32/32" },
      createdAt: new Date("2024-01-18"),
      replies: []
    },
    {
      id: "2",
      content: "Love the synthwave soundtrack. How did you implement the dynamic audio system?",
      user: { name: "Mike R.", avatar: "/api/placeholder/32/32" },
      createdAt: new Date("2024-01-19"),
      replies: [
        {
          id: "3",
          content: "Thanks! I used Unity's Audio Mixer with real-time parameter control based on gameplay events.",
          user: { name: "Alex Chen", avatar: "/api/placeholder/32/32" },
          createdAt: new Date("2024-01-19"),
          replies: []
        }
      ]
    }
  ]
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [isLiked, setIsLiked] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {mockProject.title}
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-4">
                {mockProject.shortDescription}
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{mockProject.views} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{mockProject.likes} likes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Completed {mockProject.completedAt.toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                className="gap-2"
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                {isLiked ? "Liked" : "Like"}
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Flag className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Creator info */}
          <div className="flex items-center gap-3 mb-6">
            <Avatar className="w-12 h-12">
              <AvatarImage src={mockProject.user.avatar} alt={mockProject.user.name} />
              <AvatarFallback>{mockProject.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                {mockProject.user.name}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {mockProject.user.bio}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {mockProject.playableUrl && (
              <Button className="gap-2">
                <Play className="w-4 h-4" />
                Play Game
              </Button>
            )}
            {mockProject.sourceCodeUrl && (
              <Button variant="outline" className="gap-2">
                <Github className="w-4 h-4" />
                Source Code
              </Button>
            )}
            {mockProject.downloadUrl && (
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Media showcase */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-8">
              <div className="aspect-video">
                {mockProject.videoUrl ? (
                  <VideoPlayer
                    url={mockProject.videoUrl}
                    className="w-full h-full"
                  />
                ) : (
                  <img
                    src={mockProject.screenshots[selectedImage]}
                    alt={mockProject.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Screenshot thumbnails */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex gap-2 overflow-x-auto">
                  {mockProject.screenshots.map((screenshot, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index
                          ? "border-blue-500"
                          : "border-slate-200 dark:border-slate-600"
                      }`}
                    >
                      <img
                        src={screenshot}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Project details tabs */}
            <Tabs defaultValue="overview" className="mb-8">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="development">Development</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="comments">Comments ({mockProject.comments.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-xl font-semibold mb-4">About This Project</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {mockProject.description}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-xl font-semibold mb-4">Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mockProject.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="development" className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-xl font-semibold mb-4">Development Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">Development Time</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{mockProject.developmentTime}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">Team Size</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{mockProject.teamSize} {mockProject.teamSize === 1 ? 'person' : 'people'}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium mb-2">My Role</h4>
                    <p className="text-slate-600 dark:text-slate-400">{mockProject.myRole}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-xl font-semibold mb-4">Challenges & Learnings</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">Challenges</h4>
                      <p className="text-slate-600 dark:text-slate-400">{mockProject.challenges}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 text-green-600 dark:text-green-400">Key Learnings</h4>
                      <p className="text-slate-600 dark:text-slate-400">{mockProject.learnings}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="technical" className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-xl font-semibold mb-4">Technologies Used</h3>
                  <div className="flex flex-wrap gap-2">
                    {mockProject.technologies.map((tech, index) => (
                      <Badge key={index} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-xl font-semibold mb-4">External Links</h3>
                  <div className="space-y-3">
                    {mockProject.playableUrl && (
                      <a
                        href={mockProject.playableUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Play Online
                      </a>
                    )}
                    {mockProject.sourceCodeUrl && (
                      <a
                        href={mockProject.sourceCodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Code className="w-4 h-4" />
                        Source Code Repository
                      </a>
                    )}
                    {mockProject.downloadUrl && (
                      <a
                        href={mockProject.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Download className="w-4 h-4" />
                        Download Game
                      </a>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comments">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-xl font-semibold mb-6">Comments</h3>

                  <div className="space-y-6">
                    {mockProject.comments.map((comment) => (
                      <div key={comment.id} className="border-b border-slate-200 dark:border-slate-700 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                            <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{comment.user.name}</span>
                              <span className="text-xs text-slate-500">
                                {comment.createdAt.toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                              {comment.content}
                            </p>

                            {comment.replies && comment.replies.length > 0 && (
                              <div className="ml-4 mt-3 space-y-3">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="flex items-start gap-3">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={reply.user.avatar} alt={reply.user.name} />
                                      <AvatarFallback>{reply.user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-xs">{reply.user.name}</span>
                                        <span className="text-xs text-slate-500">
                                          {reply.createdAt.toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-slate-600 dark:text-slate-400 text-xs">
                                        {reply.content}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick stats */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Project Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Category</span>
                  <Badge variant="outline">{mockProject.category.replace('_', ' ')}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Engine</span>
                  <Badge variant="outline">{mockProject.engine}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Views</span>
                  <span className="font-medium">{mockProject.views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Likes</span>
                  <span className="font-medium">{mockProject.likes.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {mockProject.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Related projects placeholder */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4">More from {mockProject.user.name}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Check out other projects by this developer...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}