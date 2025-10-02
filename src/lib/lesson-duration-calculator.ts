/**
 * Lesson duration estimation utilities
 * Estimates duration based on content type and size
 */

export interface DurationEstimate {
  minutes: number
  breakdown: {
    reading?: number
    video?: number
    quiz?: number
    interactive?: number
    project?: number
  }
  confidence: 'low' | 'medium' | 'high'
}

/**
 * Calculate reading time based on word count
 * Average reading speed: 200-250 words per minute
 * @param wordCount - Number of words
 * @returns Reading time in minutes
 */
export function calculateReadingTime(wordCount: number): number {
  const WORDS_PER_MINUTE = 225 // Average reading speed
  return Math.ceil(wordCount / WORDS_PER_MINUTE)
}

/**
 * Extract word count from HTML content
 * @param htmlContent - HTML string
 * @returns Word count
 */
export function getWordCount(htmlContent: string): number {
  // Remove HTML tags and count words
  const text = htmlContent.replace(/<[^>]*>/g, ' ').trim()
  const words = text.split(/\s+/).filter(word => word.length > 0)
  return words.length
}

/**
 * Estimate duration for a quiz lesson
 * @param questionCount - Number of questions
 * @param difficulty - Difficulty level
 * @returns Estimated time in minutes
 */
export function estimateQuizDuration(
  questionCount: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): number {
  const baseTimePerQuestion = {
    easy: 1,
    medium: 2,
    hard: 3
  }

  return Math.ceil(questionCount * baseTimePerQuestion[difficulty])
}

/**
 * Estimate duration for an interactive coding lesson
 * @param codeBlocks - Number of code exercises
 * @param complexity - Complexity level
 * @returns Estimated time in minutes
 */
export function estimateInteractiveDuration(
  codeBlocks: number,
  complexity: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): number {
  const baseTimePerExercise = {
    beginner: 5,
    intermediate: 10,
    advanced: 15
  }

  return Math.ceil(codeBlocks * baseTimePerExercise[complexity])
}

/**
 * Estimate duration for a project lesson
 * @param projectSize - Size of the project
 * @returns Estimated time in minutes
 */
export function estimateProjectDuration(
  projectSize: 'small' | 'medium' | 'large' = 'medium'
): number {
  const projectDurations = {
    small: 30,
    medium: 60,
    large: 120
  }

  return projectDurations[projectSize]
}

/**
 * Comprehensive lesson duration estimator
 * @param lessonData - Lesson information
 * @returns Duration estimate with breakdown
 */
export function estimateLessonDuration(lessonData: {
  type: 'VIDEO' | 'READING' | 'QUIZ' | 'INTERACTIVE' | 'PROJECT'
  content?: string
  videoLength?: number // in minutes
  questionCount?: number
  codeBlocks?: number
  projectSize?: 'small' | 'medium' | 'large'
  difficulty?: 'easy' | 'medium' | 'hard' | 'beginner' | 'intermediate' | 'advanced'
}): DurationEstimate {
  let minutes = 0
  const breakdown: DurationEstimate['breakdown'] = {}
  let confidence: DurationEstimate['confidence'] = 'medium'

  switch (lessonData.type) {
    case 'VIDEO':
      if (lessonData.videoLength) {
        minutes = lessonData.videoLength
        breakdown.video = lessonData.videoLength
        confidence = 'high'
      } else {
        // Estimate based on content if no video length
        const wordCount = lessonData.content ? getWordCount(lessonData.content) : 0
        // Assume 150 words per minute for video content (slower than reading)
        minutes = Math.ceil(wordCount / 150) || 10 // Default 10 min if no content
        breakdown.video = minutes
        confidence = 'low'
      }
      break

    case 'READING':
      if (lessonData.content) {
        const wordCount = getWordCount(lessonData.content)
        minutes = calculateReadingTime(wordCount) || 5 // Default 5 min
        breakdown.reading = minutes
        confidence = 'high'
      } else {
        minutes = 5
        breakdown.reading = 5
        confidence = 'low'
      }
      break

    case 'QUIZ':
      if (lessonData.questionCount) {
        const difficulty = lessonData.difficulty as 'easy' | 'medium' | 'hard' | undefined
        minutes = estimateQuizDuration(lessonData.questionCount, difficulty)
        breakdown.quiz = minutes
        confidence = 'high'
      } else {
        minutes = 10 // Default
        breakdown.quiz = 10
        confidence = 'low'
      }
      break

    case 'INTERACTIVE':
      if (lessonData.codeBlocks) {
        const complexity = lessonData.difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined
        minutes = estimateInteractiveDuration(lessonData.codeBlocks, complexity)
        breakdown.interactive = minutes
        confidence = 'medium'
      } else {
        minutes = 15 // Default
        breakdown.interactive = 15
        confidence = 'low'
      }
      // Add reading time for instructions if content exists
      if (lessonData.content) {
        const wordCount = getWordCount(lessonData.content)
        const readingTime = calculateReadingTime(wordCount)
        breakdown.reading = readingTime
        minutes += readingTime
      }
      break

    case 'PROJECT':
      minutes = estimateProjectDuration(lessonData.projectSize)
      breakdown.project = minutes
      confidence = 'medium'
      // Add reading time for instructions if content exists
      if (lessonData.content) {
        const wordCount = getWordCount(lessonData.content)
        const readingTime = calculateReadingTime(wordCount)
        breakdown.reading = readingTime
        minutes += readingTime
      }
      break

    default:
      minutes = 10
      confidence = 'low'
  }

  return {
    minutes: Math.max(1, minutes), // Minimum 1 minute
    breakdown,
    confidence
  }
}

/**
 * Format duration for display
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "1h 30m" or "45m")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (mins === 0) {
    return `${hours}h`
  }

  return `${hours}h ${mins}m`
}

/**
 * Calculate total duration for a list of lessons
 * @param lessons - Array of lesson durations
 * @returns Total duration in minutes
 */
export function calculateTotalDuration(lessons: { duration: number }[]): number {
  return lessons.reduce((total, lesson) => total + lesson.duration, 0)
}

/**
 * Validate duration estimate
 * @param estimate - Duration estimate
 * @returns Validation result with warnings
 */
export function validateDurationEstimate(estimate: DurationEstimate): {
  isValid: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  if (estimate.minutes < 1) {
    warnings.push('Duration is too short (minimum 1 minute)')
  }

  if (estimate.minutes > 240) {
    warnings.push('Duration is very long (over 4 hours). Consider breaking into multiple lessons.')
  }

  if (estimate.confidence === 'low') {
    warnings.push('Duration estimate has low confidence. Consider providing more lesson details.')
  }

  return {
    isValid: estimate.minutes >= 1 && estimate.minutes <= 240,
    warnings
  }
}
