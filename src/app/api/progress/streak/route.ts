import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get all progress records for the user, ordered by last accessed date
    const progressRecords = await prisma.progress.findMany({
      where: { userId: user.id },
      select: {
        lastAccessed: true,
        timeSpent: true,
        completed: true,
      },
      orderBy: {
        lastAccessed: 'desc',
      },
    })

    // Calculate streak data
    const streakData = calculateStreak(progressRecords)

    // Get calendar heatmap data (last 365 days)
    const calendarData = generateCalendarData(progressRecords)

    return NextResponse.json({
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      lastLearningDate: streakData.lastLearningDate,
      calendarData,
      milestones: calculateMilestones(streakData.longestStreak),
    })
  } catch (error) {
    console.error("Error fetching streak data:", error)
    return NextResponse.json(
      { error: "Failed to fetch streak data" },
      { status: 500 }
    )
  }
}

function calculateStreak(progressRecords: any[]) {
  if (progressRecords.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastLearningDate: null,
    }
  }

  // Group progress by date
  const dailyActivity = new Map<string, boolean>()

  progressRecords.forEach((record) => {
    const date = record.lastAccessed.toISOString().split('T')[0]
    // Consider it active if they spent time or completed something
    dailyActivity.set(date, record.timeSpent > 0 || record.completed)
  })

  // Sort dates in descending order (most recent first)
  const sortedDates = Array.from(dailyActivity.keys()).sort((a, b) => b.localeCompare(a))

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  let lastDate: Date | null = null

  // Calculate current streak (from today backwards)
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Check if user learned today or yesterday (grace period)
  const learnedToday = dailyActivity.get(today)
  const learnedYesterday = dailyActivity.get(yesterday)

  if (learnedToday) {
    currentStreak = 1
    lastDate = new Date(today)
  } else if (learnedYesterday) {
    // Grace period - count yesterday as maintaining streak
    currentStreak = 1
    lastDate = new Date(yesterday)
  }

  // Continue counting backwards from the starting point
  if (currentStreak > 0) {
    let checkDate = new Date(lastDate!)
    checkDate.setDate(checkDate.getDate() - 1)

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (dailyActivity.get(dateStr)) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
  }

  // Calculate longest streak
  for (const date of sortedDates) {
    if (dailyActivity.get(date)) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }

  return {
    currentStreak,
    longestStreak,
    lastLearningDate: lastDate,
  }
}

function generateCalendarData(progressRecords: any[]) {
  const calendarData: { date: string; count: number; level: number }[] = []

  // Get date 365 days ago
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 365)

  // Group activity by date
  const dailyActivity = new Map<string, number>()

  progressRecords.forEach((record) => {
    const date = record.lastAccessed.toISOString().split('T')[0]
    const minutes = Math.round(record.timeSpent / 60) // Convert to minutes
    dailyActivity.set(date, (dailyActivity.get(date) || 0) + minutes)
  })

  // Generate data for each day in the past year
  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    const minutes = dailyActivity.get(dateStr) || 0
    let level = 0

    // Determine activity level based on minutes spent
    if (minutes > 120) level = 4 // Very active
    else if (minutes > 60) level = 3 // Active
    else if (minutes > 30) level = 2 // Moderate
    else if (minutes > 0) level = 1 // Light activity

    calendarData.push({
      date: dateStr,
      count: minutes,
      level,
    })
  }

  return calendarData
}

function calculateMilestones(longestStreak: number) {
  const milestones = [
    { days: 7, name: "Week Warrior", achieved: longestStreak >= 7 },
    { days: 30, name: "Monthly Master", achieved: longestStreak >= 30 },
    { days: 100, name: "Century Champion", achieved: longestStreak >= 100 },
    { days: 365, name: "Yearly Legend", achieved: longestStreak >= 365 },
  ]

  return milestones
}