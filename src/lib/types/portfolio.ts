export interface PortfolioProject {
  id: string
  title: string
  description: string
  shortDescription: string
  thumbnail: string
  screenshots: string[]
  category: ProjectCategory
  engine: GameEngine
  tags: string[]

  // Links
  playableUrl?: string
  sourceCodeUrl?: string
  downloadUrl?: string

  // Details
  developmentTime: string
  teamSize: number
  myRole: string
  challenges: string
  learnings: string

  // Technical
  technologies: string[]
  features: string[]

  // Metadata
  isPublic: boolean
  isFeatured: boolean
  completedAt: Date
  createdAt: Date
  updatedAt: Date

  // Relations
  userId: string
  courseId?: string
  likes: number
  views: number

  // Media
  videoUrl?: string
  demoImages: string[]
}

export interface PortfolioProfile {
  id: string
  userId: string
  displayName: string
  bio: string
  avatar: string
  coverImage: string
  location?: string
  website?: string
  socialLinks: {
    twitter?: string
    linkedin?: string
    github?: string
    discord?: string
  }

  // Skills & Experience
  skills: string[]
  experienceLevel: ExperienceLevel
  specializations: string[]
  availableForWork: boolean

  // Preferences
  isPublic: boolean
  showEmail: boolean
  showProjects: boolean

  // Stats
  totalProjects: number
  totalLikes: number
  totalViews: number
  joinedAt: Date

  createdAt: Date
  updatedAt: Date
}

export interface ProjectLike {
  id: string
  userId: string
  projectId: string
  createdAt: Date
}

export interface ProjectComment {
  id: string
  userId: string
  projectId: string
  content: string
  parentId?: string
  createdAt: Date
  updatedAt: Date
  user: {
    name: string
    avatar: string
  }
  replies?: ProjectComment[]
}

export type ProjectCategory =
  | "mobile_game"
  | "web_game"
  | "desktop_game"
  | "vr_ar"
  | "prototype"
  | "game_jam"
  | "portfolio_piece"
  | "commercial"
  | "educational"
  | "other"

export type GameEngine =
  | "unity"
  | "unreal"
  | "godot"
  | "construct"
  | "gamemaker"
  | "custom"
  | "web_technologies"
  | "other"

export type ExperienceLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "professional"

export interface PortfolioStats {
  totalProjects: number
  totalLikes: number
  totalViews: number
  totalComments: number
  featuredProjects: number
  projectsByCategory: Record<ProjectCategory, number>
  projectsByEngine: Record<GameEngine, number>
  recentActivity: {
    projectsThisMonth: number
    likesThisMonth: number
    viewsThisMonth: number
  }
}

export interface ProjectFilters {
  category?: ProjectCategory
  engine?: GameEngine
  tags?: string[]
  search?: string
  sortBy?: "newest" | "oldest" | "most_liked" | "most_viewed" | "featured"
  userId?: string
}

export interface ProjectFormData {
  title: string
  description: string
  shortDescription: string
  category: ProjectCategory
  engine: GameEngine
  tags: string[]

  playableUrl?: string
  sourceCodeUrl?: string
  downloadUrl?: string

  developmentTime: string
  teamSize: number
  myRole: string
  challenges: string
  learnings: string

  technologies: string[]
  features: string[]

  isPublic: boolean
  courseId?: string
}