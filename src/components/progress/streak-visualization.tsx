"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Flame, Trophy } from "lucide-react"

interface StreakVisualizationProps {
  streakData: {
    currentStreak: number
    longestStreak: number
    lastLearningDate: string | null
    calendarData: Array<{
      date: string
      count: number
      level: number
    }>
    milestones: Array<{
      days: number
      name: string
      achieved: boolean
    }>
  } | null
  loading: boolean
}

export function StreakVisualization({ streakData, loading }: StreakVisualizationProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Learning Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-gray-200 rounded-sm"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Streak Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!streakData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No streak data available</h3>
          <p className="text-muted-foreground">
            Start learning to build your streak!
          </p>
        </CardContent>
      </Card>
    )
  }

  // Get the last 12 weeks of calendar data for visualization
  const recentCalendarData = streakData.calendarData.slice(-84) // 12 weeks * 7 days

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-gray-100'
      case 1: return 'bg-green-200'
      case 2: return 'bg-green-300'
      case 3: return 'bg-green-400'
      case 4: return 'bg-green-500'
      default: return 'bg-gray-100'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Learning Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Learning Calendar
          </CardTitle>
          <CardDescription>
            Your learning activity over the past 12 weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day labels */}
              <div className="text-xs text-muted-foreground text-center">Mon</div>
              <div className="text-xs text-muted-foreground text-center">Tue</div>
              <div className="text-xs text-muted-foreground text-center">Wed</div>
              <div className="text-xs text-muted-foreground text-center">Thu</div>
              <div className="text-xs text-muted-foreground text-center">Fri</div>
              <div className="text-xs text-muted-foreground text-center">Sat</div>
              <div className="text-xs text-muted-foreground text-center">Sun</div>

              {/* Calendar cells */}
              {recentCalendarData.map((day, index) => (
                <div
                  key={day.date}
                  className={`w-3 h-3 rounded-sm ${getLevelColor(day.level)}`}
                  title={`${day.date}: ${day.count} minutes`}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
                <div className="w-3 h-3 rounded-sm bg-green-200"></div>
                <div className="w-3 h-3 rounded-sm bg-green-300"></div>
                <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                <div className="w-3 h-3 rounded-sm bg-green-500"></div>
              </div>
              <span>More</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Streak Milestones
          </CardTitle>
          <CardDescription>
            Achievements unlocked at different streak levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {streakData.milestones.map((milestone) => (
              <div
                key={milestone.days}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  milestone.achieved
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  milestone.achieved
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-300 text-gray-500'
                }`}>
                  {milestone.achieved ? (
                    <Trophy className="h-4 w-4" />
                  ) : (
                    <Flame className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    milestone.achieved ? 'text-yellow-900' : 'text-gray-700'
                  }`}>
                    {milestone.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {milestone.days} day streak
                  </p>
                </div>
                {milestone.achieved && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Achieved
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}