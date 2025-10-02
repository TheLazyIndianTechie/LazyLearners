"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VideoStreamingWrapper } from '@/components/video/video-streaming-wrapper'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function VideoTestPage() {
  const [testVideoId, setTestVideoId] = useState('sample-unity-tutorial')
  const [testCourseId, setTestCourseId] = useState('course-123e4567-e89b-12d3-a456-426614174000')
  const [showPlayer, setShowPlayer] = useState(false)

  const testScenarios = [
    {
      id: 'unity-basics',
      title: 'Unity Basics Tutorial',
      description: 'Introduction to Unity game development - basic concepts and interface overview',
      videoId: 'sample-unity-tutorial',
      courseId: 'course-123e4567-e89b-12d3-a456-426614174000',
      duration: 15 * 60, // 15 minutes
    },
    {
      id: 'csharp-fundamentals',
      title: 'C# Programming Fundamentals',
      description: 'Core C# concepts for game development including variables, functions, and OOP',
      videoId: 'sample-csharp-tutorial',
      courseId: 'course-223e4567-e89b-12d3-a456-426614174000',
      duration: 25 * 60, // 25 minutes
    },
    {
      id: 'game-physics',
      title: 'Game Physics and Rigidbodies',
      description: 'Understanding physics simulation in Unity with practical examples',
      videoId: 'sample-physics-tutorial',
      courseId: 'course-323e4567-e89b-12d3-a456-426614174000',
      duration: 18 * 60, // 18 minutes
    }
  ]

  const [selectedScenario, setSelectedScenario] = useState(testScenarios[0])

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          🎮 LazyGameDevs Video Streaming Test
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Test the comprehensive video streaming and adaptive quality system for the GameLearn Platform
        </p>
        <Badge variant="outline" className="text-lg px-4 py-2">
          Advanced Video Infrastructure Testing
        </Badge>
      </div>

      <Tabs defaultValue="player" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="player">Video Player</TabsTrigger>
          <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
          <TabsTrigger value="upload">Upload Test</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Video Player Tab */}
        <TabsContent value="player" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Streaming Test</CardTitle>
              <CardDescription>
                Test the advanced video player with adaptive quality, analytics, and session management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="videoId">Video ID</Label>
                  <Input
                    id="videoId"
                    value={testVideoId}
                    onChange={(e) => setTestVideoId(e.target.value)}
                    placeholder="Enter video ID"
                  />
                </div>
                <div>
                  <Label htmlFor="courseId">Course ID (Optional)</Label>
                  <Input
                    id="courseId"
                    value={testCourseId}
                    onChange={(e) => setTestCourseId(e.target.value)}
                    placeholder="Enter course ID"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowPlayer(true)}
                  disabled={!testVideoId}
                >
                  Load Video Player
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPlayer(false)}
                >
                  Reset
                </Button>
              </div>

              {showPlayer && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <VideoStreamingWrapper
                    videoId={testVideoId}
                    courseId={testCourseId || undefined}
                    title={selectedScenario.title}
                    description={selectedScenario.description}
                    className="w-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testScenarios.map((scenario) => (
              <Card
                key={scenario.id}
                className={`cursor-pointer transition-all ${
                  selectedScenario.id === scenario.id
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => {
                  setSelectedScenario(scenario)
                  setTestVideoId(scenario.videoId)
                  setTestCourseId(scenario.courseId)
                }}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{scenario.title}</CardTitle>
                  <CardDescription>{scenario.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Duration:</span>
                      <span>{Math.floor(scenario.duration / 60)} minutes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Video ID:</span>
                      <code className="text-xs bg-gray-100 px-1 rounded">
                        {scenario.videoId}
                      </code>
                    </div>
                    {selectedScenario.id === scenario.id && (
                      <Badge className="w-full justify-center">Selected</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Selected Scenario: {selectedScenario.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => {
                  setShowPlayer(true)
                  // Switch to player tab
                  const tabTrigger = document.querySelector('[value="player"]') as HTMLElement
                  tabTrigger?.click()
                }}
                className="w-full"
              >
                Test This Scenario
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Test Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Upload API Test</CardTitle>
              <CardDescription>
                Test the video upload and processing pipeline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Upload Endpoint:</strong> <code>/api/video/upload</code></p>
                <p><strong>Supported Formats:</strong> MP4, MOV, AVI, WebM</p>
                <p><strong>Max File Size:</strong> 2GB</p>
                <p><strong>Quality Levels:</strong> 240p, 360p, 480p, 720p, 1080p</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800">⚠️ Note for Testing</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Video upload requires instructor privileges and actual video file processing.
                  In a real implementation, this would integrate with FFmpeg and cloud storage.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Test Upload Metadata</Label>
                <Textarea
                  placeholder={JSON.stringify({
                    title: "Test Unity Tutorial",
                    description: "Sample video for testing upload pipeline",
                    chapter: "Getting Started",
                    isPublic: false,
                    qualities: ["720p", "1080p"],
                    generateThumbnails: true,
                    enableDRM: true
                  }, null, 2)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><strong>Track Events:</strong> <code>POST /api/video/analytics</code></div>
                <div><strong>Get Analytics:</strong> <code>GET /api/video/analytics</code></div>
                <div><strong>Heartbeat:</strong> <code>POST /api/video/heartbeat</code></div>
                <div><strong>Session Status:</strong> <code>GET /api/video/heartbeat</code></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tracked Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div>• Play/Pause events</div>
                <div>• Seeking behavior</div>
                <div>• Quality changes</div>
                <div>• Volume adjustments</div>
                <div>• Fullscreen toggles</div>
                <div>• Buffering issues</div>
                <div>• Video completion</div>
                <div>• Error events</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Real-time Monitoring</CardTitle>
              <CardDescription>
                The video player sends heartbeat data every 10 seconds when playing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 border rounded-lg p-4 font-mono text-sm">
                <div className="text-gray-600">Sample heartbeat payload:</div>
                <pre>{JSON.stringify({
                  sessionId: "session_123456789",
                  currentPosition: 125.5,
                  bufferHealth: 85,
                  quality: "720p",
                  playbackRate: 1.0,
                  volume: 0.8,
                  isPlaying: true,
                  isFullscreen: false,
                  networkInfo: {
                    effectiveType: "4g",
                    downlink: 10.5,
                    rtt: 50
                  }
                }, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* LazyGameDevs Branding */}
      <div className="text-center text-sm text-gray-500 border-t pt-4">
        <p>🎮 LazyGameDevs GameLearn Platform • Advanced Video Streaming Infrastructure</p>
        <p>Built with Next.js 15, TypeScript, and enterprise-grade video processing</p>
      </div>
    </div>
  )
}