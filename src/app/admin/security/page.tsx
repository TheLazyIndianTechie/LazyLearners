'use client'

/**
 * Security Monitoring Dashboard
 * Real-time security metrics and monitoring
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Shield, AlertTriangle, Database, Activity, Clock, TrendingUp } from 'lucide-react'

interface SecurityMetrics {
  authentication: {
    totalFailedAttempts: number
    lockedAccounts: number
    suspiciousIps: number
  }
  database: {
    totalQueries: number
    averageResponseTime: number
    slowQueries: number
    slowQueryPercentage: string
    topSlowQueries: Array<{
      operation: string
      model: string
      duration: number
      warning?: string
    }>
  }
  system: {
    timestamp: string
    uptime: number
    memoryUsage: {
      heapUsed: number
      heapTotal: number
      rss: number
    }
  }
  error?: string
}

export default function SecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/security')

      if (!response.ok) {
        throw new Error('Failed to fetch security metrics')
      }

      const data = await response.json()
      setMetrics(data.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getSeverityBadge = (value: number, threshold: number) => {
    if (value === 0) return <Badge variant="outline">Good</Badge>
    if (value < threshold) return <Badge variant="default">Normal</Badge>
    return <Badge variant="destructive">High</Badge>
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && !metrics) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Monitoring</h1>
          <p className="text-muted-foreground">Real-time security metrics and alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="px-4 py-2 text-sm rounded-md border hover:bg-accent"
          >
            {autoRefresh ? 'Disable' : 'Enable'} Auto-Refresh
          </button>
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 text-sm rounded-md border hover:bg-accent"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Alerts */}
      {metrics.error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>{metrics.error}</AlertDescription>
        </Alert>
      )}

      {metrics.authentication.lockedAccounts > 0 && (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Active Lockouts</AlertTitle>
          <AlertDescription>
            {metrics.authentication.lockedAccounts} account(s) currently locked due to failed login attempts
          </AlertDescription>
        </Alert>
      )}

      {/* Authentication Metrics */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Authentication Security
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.authentication.totalFailedAttempts}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
              {getSeverityBadge(metrics.authentication.totalFailedAttempts, 10)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Locked Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.authentication.lockedAccounts}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently active</p>
              {getSeverityBadge(metrics.authentication.lockedAccounts, 5)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Suspicious IPs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.authentication.suspiciousIps}</div>
              <p className="text-xs text-muted-foreground mt-1">Flagged addresses</p>
              {getSeverityBadge(metrics.authentication.suspiciousIps, 3)}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Database Performance */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Database className="h-6 w-6" />
          Database Performance
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.database.totalQueries.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.database.averageResponseTime}ms</div>
              <p className="text-xs text-muted-foreground mt-1">Per query</p>
              {metrics.database.averageResponseTime < 100 ? (
                <Badge variant="outline">Excellent</Badge>
              ) : metrics.database.averageResponseTime < 500 ? (
                <Badge variant="default">Good</Badge>
              ) : (
                <Badge variant="destructive">Slow</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Slow Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.database.slowQueries}</div>
              <p className="text-xs text-muted-foreground mt-1">{metrics.database.slowQueryPercentage}% of total</p>
              {parseInt(metrics.database.slowQueryPercentage) < 5 ? (
                <Badge variant="outline">Good</Badge>
              ) : parseInt(metrics.database.slowQueryPercentage) < 10 ? (
                <Badge variant="default">Fair</Badge>
              ) : (
                <Badge variant="destructive">Poor</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.system.memoryUsage.heapUsed}MB</div>
              <p className="text-xs text-muted-foreground mt-1">
                of {metrics.system.memoryUsage.heapTotal}MB
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Slow Queries */}
      {metrics.database.topSlowQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Slowest Queries
            </CardTitle>
            <CardDescription>Top 5 slowest database queries today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.database.topSlowQueries.map((query, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">
                      {query.model}.{query.operation}
                    </div>
                    {query.warning && (
                      <div className="text-sm text-muted-foreground">{query.warning}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono font-semibold">{query.duration}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uptime</span>
            <span className="font-medium">{formatUptime(metrics.system.uptime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Heap Memory</span>
            <span className="font-medium">
              {metrics.system.memoryUsage.heapUsed}MB / {metrics.system.memoryUsage.heapTotal}MB
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">RSS Memory</span>
            <span className="font-medium">{metrics.system.memoryUsage.rss}MB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated</span>
            <span className="font-medium">{new Date(metrics.system.timestamp).toLocaleTimeString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
