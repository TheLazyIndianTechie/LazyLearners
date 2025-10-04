"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Clock, Target, RotateCcw } from "lucide-react"

interface QuizSettingsProps {
  passingScore: number
  timeLimit?: number
  onPassingScoreChange: (score: number) => void
  onTimeLimitChange: (minutes?: number) => void
}

export function QuizSettings({
  passingScore,
  timeLimit,
  onPassingScoreChange,
  onTimeLimitChange,
}: QuizSettingsProps) {
  const hasTimeLimit = timeLimit !== undefined && timeLimit > 0

  return (
    <div className="space-y-6">
      {/* Passing Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <CardTitle>Passing Score</CardTitle>
          </div>
          <CardDescription>
            Set the minimum score percentage required to pass this quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="passing-score">Passing Score</Label>
              <span className="text-2xl font-bold text-blue-600">
                {passingScore}%
              </span>
            </div>

            <Slider
              id="passing-score"
              min={50}
              max={100}
              step={5}
              value={[passingScore]}
              onValueChange={([value]) => onPassingScoreChange(value)}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-gray-600">
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Students must score at least <strong>{passingScore}%</strong> to
              pass this quiz. They will see their results immediately after
              submission.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Time Limit */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <CardTitle>Time Limit</CardTitle>
          </div>
          <CardDescription>
            Set a time limit for completing this quiz (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="time-limit-toggle">Enable Time Limit</Label>
              <p className="text-sm text-gray-600">
                Restrict how long students have to complete the quiz
              </p>
            </div>
            <Switch
              id="time-limit-toggle"
              checked={hasTimeLimit}
              onCheckedChange={(checked) =>
                onTimeLimitChange(checked ? 30 : undefined)
              }
            />
          </div>

          {hasTimeLimit && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="time-limit-input">
                  Time Limit (minutes)
                </Label>
                <Input
                  id="time-limit-input"
                  type="number"
                  min="5"
                  max="180"
                  step="5"
                  value={timeLimit || 30}
                  onChange={(e) =>
                    onTimeLimitChange(parseInt(e.target.value) || 30)
                  }
                />
              </div>

              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  Quiz will auto-submit after{" "}
                  <strong>{timeLimit} minutes</strong>. Students will see a
                  countdown timer while taking the quiz.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Retake Policy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-green-600" />
            <CardTitle>Retake Policy</CardTitle>
          </div>
          <CardDescription>
            Configure how students can retake this quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Unlimited retakes enabled.</strong> Students can retake
              this quiz as many times as needed. Their highest score will be
              recorded.
            </p>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Students can see their previous attempts</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Questions may be shuffled on retake</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Explanations shown after submission</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Settings Info */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Behavior</CardTitle>
          <CardDescription>
            Default quiz settings for students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium mb-1">Question Navigation</p>
              <p className="text-gray-600">
                Students can navigate between questions and change answers
                before submission
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium mb-1">Progress Tracking</p>
              <p className="text-gray-600">
                Quiz completion counts toward lesson progress when passing score
                is achieved
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium mb-1">Answer Feedback</p>
              <p className="text-gray-600">
                Students see correct answers and explanations after submission
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
