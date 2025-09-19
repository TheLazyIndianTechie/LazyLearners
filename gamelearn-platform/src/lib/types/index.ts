// User Types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'student' | 'instructor' | 'admin'
  enrolledCourses: string[]
  createdCourses: string[]
  portfolio: Portfolio
  certifications: Certification[]
  createdAt: Date
  updatedAt: Date
}

// Course Types
export interface Course {
  id: string
  title: string
  description: string
  thumbnail: string
  instructor: User
  category: CourseCategory
  engine: GameEngine
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number // in minutes
  price: number
  rating: number
  reviewCount: number
  modules: Module[]
  requirements: string[]
  objectives: string[]
  tags: string[]
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Module {
  id: string
  title: string
  description: string
  lessons: Lesson[]
  order: number
  duration: number
}

export interface Lesson {
  id: string
  title: string
  type: 'video' | 'interactive' | 'quiz' | 'project'
  content: LessonContent
  duration: number
  order: number
  isCompleted?: boolean
  resources: Resource[]
}

export interface LessonContent {
  videoUrl?: string
  transcription?: string
  codeSnippets?: CodeSnippet[]
  assets?: Asset[]
  quiz?: Quiz
  project?: Project
}

// Game Engine Types
export type GameEngine = 'unity' | 'unreal' | 'godot' | 'custom'

export interface GameProject {
  id: string
  name: string
  engine: GameEngine
  description: string
  thumbnail?: string
  webglBuild?: string
  sourceCode?: string
  collaborators: User[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

// Portfolio Types
export interface Portfolio {
  id: string
  userId: string
  projects: GameProject[]
  skills: Skill[]
  achievements: Achievement[]
  isPublic: boolean
  customDomain?: string
}

export interface Skill {
  name: string
  level: number // 1-5
  category: 'programming' | 'art' | 'design' | 'audio'
}

// Assessment Types
export interface Quiz {
  id: string
  questions: Question[]
  timeLimit?: number
  passingScore: number
}

export interface Question {
  id: string
  type: 'multiple-choice' | 'code' | 'practical'
  question: string
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
}

export interface Project {
  id: string
  title: string
  description: string
  requirements: string[]
  rubric: Rubric[]
  submissionFormat: 'code' | 'webgl' | 'video' | 'document'
}

export interface Rubric {
  criteria: string
  maxPoints: number
  description: string
}

// Community Types
export interface ForumPost {
  id: string
  author: User
  title: string
  content: string
  category: string
  tags: string[]
  replies: Reply[]
  likes: number
  views: number
  createdAt: Date
  updatedAt: Date
}

export interface Reply {
  id: string
  author: User
  content: string
  parentId?: string
  likes: number
  createdAt: Date
}

// Learning Progress Types
export interface Progress {
  userId: string
  courseId: string
  moduleId?: string
  lessonId?: string
  completionPercentage: number
  timeSpent: number
  lastAccessed: Date
  quizScores: QuizScore[]
  projectSubmissions: ProjectSubmission[]
}

export interface QuizScore {
  quizId: string
  score: number
  maxScore: number
  completedAt: Date
}

export interface ProjectSubmission {
  projectId: string
  submissionUrl: string
  score?: number
  feedback?: string
  submittedAt: Date
  gradedAt?: Date
}

// Certification Types
export interface Certification {
  id: string
  name: string
  issuer: string
  credentialId: string
  issuedDate: Date
  expiryDate?: Date
  badgeUrl: string
  verificationUrl: string
}

// Real-time Collaboration Types
export interface CollaborationSession {
  id: string
  projectId: string
  participants: User[]
  isActive: boolean
  createdAt: Date
}

export interface CodeChange {
  id: string
  sessionId: string
  userId: string
  fileId: string
  changes: string
  timestamp: Date
}

// Analytics Types
export interface LearningAnalytics {
  userId: string
  totalTimeSpent: number
  coursesCompleted: number
  averageQuizScore: number
  skillProgression: SkillProgression[]
  learningStreak: number
  weeklyActivity: WeeklyActivity[]
}

export interface SkillProgression {
  skill: string
  currentLevel: number
  progress: number
  trend: 'improving' | 'stable' | 'declining'
}

export interface WeeklyActivity {
  week: string
  timeSpent: number
  lessonsCompleted: number
  quizzesTaken: number
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  totalItems: number
  totalPages: number
  currentPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Course Categories
export type CourseCategory =
  | 'game-programming'
  | 'game-design'
  | 'game-art'
  | 'game-audio'
  | 'unity-development'
  | 'unreal-development'
  | 'godot-development'
  | 'mobile-games'
  | 'indie-development'
  | 'vr-ar-development'

// Resource Types
export interface Resource {
  id: string
  name: string
  type: 'pdf' | 'video' | 'audio' | 'image' | 'code' | 'asset'
  url: string
  size: number
  downloadable: boolean
}

export interface Asset {
  id: string
  name: string
  type: 'texture' | 'model' | 'audio' | 'script' | 'prefab'
  engine: GameEngine
  fileUrl: string
  previewUrl?: string
  size: number
  license: 'free' | 'premium' | 'commercial'
}

export interface CodeSnippet {
  id: string
  language: string
  code: string
  explanation?: string
  runnable: boolean
}

export interface Achievement {
  id: string
  name: string
  description: string
  iconUrl: string
  unlockedAt: Date
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}