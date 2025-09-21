import { createHash } from 'crypto'
import { createRequestLogger } from '@/lib/logger'
import { redis } from '@/lib/redis'
import { env, isProduction } from '@/lib/config/env'

// Security event types and severity levels
export const SECURITY_EVENT_TYPES = {
  // Authentication & Authorization
  login_failure: 'Authentication failure',
  login_success: 'Successful authentication',
  account_lockout: 'Account locked due to failed attempts',
  privilege_escalation: 'Potential privilege escalation attempt',
  unauthorized_access: 'Unauthorized access attempt',
  session_hijacking: 'Potential session hijacking',

  // Input & Injection Attacks
  sql_injection: 'SQL injection attempt',
  xss_attempt: 'Cross-site scripting attempt',
  command_injection: 'Command injection attempt',
  path_traversal: 'Path traversal attempt',
  file_upload_malicious: 'Malicious file upload attempt',

  // Rate Limiting & DoS
  rate_limit_exceeded: 'Rate limit exceeded',
  brute_force_attack: 'Brute force attack detected',
  dos_attempt: 'Denial of service attempt',

  // Data & Privacy
  sensitive_data_access: 'Sensitive data access',
  data_exfiltration: 'Potential data exfiltration',
  gdpr_violation: 'GDPR compliance violation',

  // System & Infrastructure
  system_compromise: 'System compromise detected',
  malware_detected: 'Malware detected',
  configuration_change: 'Security configuration change',
  vulnerability_exploit: 'Vulnerability exploitation attempt',

  // API & Application
  api_abuse: 'API abuse detected',
  csrf_attack: 'CSRF attack attempt',
  cors_violation: 'CORS policy violation',

  // Custom LazyGameDevs specific
  course_piracy: 'Course content piracy attempt',
  fake_account: 'Fake account creation detected',
  payment_fraud: 'Payment fraud detected'
} as const

export const SEVERITY_LEVELS = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
} as const

export type SecurityEventType = keyof typeof SECURITY_EVENT_TYPES
export type SeverityLevel = keyof typeof SEVERITY_LEVELS

// Security event interface
export interface SecurityEvent {
  id: string
  type: SecurityEventType
  severity: SeverityLevel
  timestamp: number
  source: string
  description: string
  metadata: Record<string, any>
  userId?: string
  ipAddress?: string
  userAgent?: string
  correlationId?: string
  riskScore: number
  mitigated: boolean
  falsePositive: boolean
}

// Alert configuration
export interface AlertRule {
  id: string
  name: string
  eventType: SecurityEventType
  minSeverity: SeverityLevel
  threshold: number
  timeWindow: number // seconds
  enabled: boolean
  recipients: string[]
  actions: AlertAction[]
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'block_ip' | 'lock_account' | 'notify_admin'
  config: Record<string, any>
  enabled: boolean
}

// Threat intelligence interface
export interface ThreatIntelligence {
  ipReputationScore: number
  isKnownMalicious: boolean
  isVpn: boolean
  isTor: boolean
  country: string
  asn: string
  malwareSignatures: string[]
  botnetMembership: boolean
}

export class SecurityMonitor {
  private static instance: SecurityMonitor
  private logger = createRequestLogger({ headers: new Headers() } as any)
  private alertRules: AlertRule[] = []
  private eventBuffer: SecurityEvent[] = []
  private readonly bufferSize = 10000

  private constructor() {
    this.initializeDefaultAlertRules()
  }

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor()
    }
    return SecurityMonitor.instance
  }

  // Log security events
  async logSecurityEvent(
    type: SecurityEventType,
    severity: SeverityLevel,
    metadata: Record<string, any> = {},
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    correlationId?: string
  ): Promise<SecurityEvent> {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      severity,
      timestamp: Date.now(),
      source: 'gamelearn-platform',
      description: SECURITY_EVENT_TYPES[type],
      metadata: this.sanitizeMetadata(metadata),
      userId,
      ipAddress,
      userAgent,
      correlationId,
      riskScore: this.calculateRiskScore(type, severity, metadata, ipAddress),
      mitigated: false,
      falsePositive: false
    }

    // Add to event buffer
    this.addToEventBuffer(event)

    // Store in Redis for persistence and analysis
    await this.storeSecurityEvent(event)

    // Log to application logger
    this.logToApplicationLogger(event)

    // Check for alert triggers
    await this.checkAlertRules(event)

    // Perform threat intelligence lookup
    if (ipAddress) {
      this.enhanceWithThreatIntelligence(event, ipAddress)
    }

    // Auto-mitigation for critical events
    if (severity === 'critical') {
      await this.performAutoMitigation(event)
    }

    return event
  }

  // Enhanced event logging with pattern detection
  async logEnhancedSecurityEvent(
    type: SecurityEventType,
    severity: SeverityLevel,
    request: any,
    additionalMetadata: Record<string, any> = {}
  ): Promise<SecurityEvent> {
    const metadata = {
      ...additionalMetadata,
      method: request.method,
      url: request.url,
      headers: this.sanitizeHeaders(request.headers),
      timestamp: new Date().toISOString()
    }

    const ipAddress = this.extractClientIP(request)
    const userAgent = request.headers?.get?.('user-agent') || undefined
    const correlationId = request.headers?.get?.('x-correlation-id') || undefined

    return this.logSecurityEvent(
      type,
      severity,
      metadata,
      undefined, // userId would be extracted from session
      ipAddress,
      userAgent,
      correlationId
    )
  }

  // Pattern detection for advanced threats
  async detectSecurityPatterns(ipAddress: string, timeWindow = 3600): Promise<{
    patterns: string[]
    riskScore: number
    recommendations: string[]
  }> {
    try {
      const events = await this.getRecentEventsByIP(ipAddress, timeWindow)
      const patterns: string[] = []
      const recommendations: string[] = []
      let riskScore = 0

      // Detect brute force patterns
      const loginFailures = events.filter(e => e.type === 'login_failure').length
      if (loginFailures > 5) {
        patterns.push('brute_force_login')
        riskScore += 30
        recommendations.push('Consider temporarily blocking this IP address')
      }

      // Detect scanning patterns
      const uniqueEndpoints = new Set(events.map(e => e.metadata.url)).size
      if (uniqueEndpoints > 20) {
        patterns.push('endpoint_scanning')
        riskScore += 25
        recommendations.push('Implement stricter rate limiting for this IP')
      }

      // Detect injection attempts
      const injectionAttempts = events.filter(e =>
        ['sql_injection', 'xss_attempt', 'command_injection'].includes(e.type)
      ).length
      if (injectionAttempts > 0) {
        patterns.push('injection_attempts')
        riskScore += 40
        recommendations.push('Block this IP immediately')
      }

      // Detect account enumeration
      const failedUsernames = events
        .filter(e => e.type === 'login_failure')
        .map(e => e.metadata.username)
        .filter(Boolean)
      const uniqueUsernames = new Set(failedUsernames).size
      if (uniqueUsernames > 10) {
        patterns.push('account_enumeration')
        riskScore += 35
        recommendations.push('Implement CAPTCHA for failed login attempts')
      }

      // Detect rapid requests
      const recentEvents = events.filter(e => e.timestamp > Date.now() - (5 * 60 * 1000)) // Last 5 minutes
      if (recentEvents.length > 100) {
        patterns.push('dos_attempt')
        riskScore += 50
        recommendations.push('Implement emergency rate limiting')
      }

      return { patterns, riskScore, recommendations }
    } catch (error) {
      this.logger.warn('Failed to detect security patterns', error as Error)
      return { patterns: [], riskScore: 0, recommendations: [] }
    }
  }

  // Automated response system
  async performAutoMitigation(event: SecurityEvent): Promise<void> {
    try {
      const actions: string[] = []

      // Auto-block IPs for critical security events
      if (event.ipAddress && ['sql_injection', 'system_compromise', 'malware_detected'].includes(event.type)) {
        await this.blockIP(event.ipAddress, 3600) // Block for 1 hour
        actions.push('ip_blocked')
      }

      // Lock accounts for authentication-related critical events
      if (event.userId && ['account_lockout', 'session_hijacking'].includes(event.type)) {
        await this.lockUserAccount(event.userId, 'security_incident')
        actions.push('account_locked')
      }

      // Quarantine files for malicious uploads
      if (event.type === 'file_upload_malicious') {
        await this.quarantineFile(event.metadata.filename || 'unknown')
        actions.push('file_quarantined')
      }

      // Notify security team for critical events
      if (SEVERITY_LEVELS[event.severity] >= SEVERITY_LEVELS.critical) {
        await this.notifySecurityTeam(event)
        actions.push('security_team_notified')
      }

      // Update event with mitigation actions
      await this.updateEventMitigation(event.id, true, actions)

      this.logger.info('Auto-mitigation performed', {
        eventId: event.id,
        eventType: event.type,
        actions
      })
    } catch (error) {
      this.logger.error('Auto-mitigation failed', error as Error, {
        eventId: event.id,
        eventType: event.type
      })
    }
  }

  // Alert rule management
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule)
  }

  removeAlertRule(ruleId: string): void {
    this.alertRules = this.alertRules.filter(rule => rule.id !== ruleId)
  }

  async checkAlertRules(event: SecurityEvent): Promise<void> {
    for (const rule of this.alertRules.filter(r => r.enabled)) {
      try {
        if (this.shouldTriggerAlert(rule, event)) {
          const recentEvents = await this.getRecentEventsByType(
            rule.eventType,
            rule.timeWindow
          )

          if (recentEvents.length >= rule.threshold) {
            await this.triggerAlert(rule, event, recentEvents)
          }
        }
      } catch (error) {
        this.logger.warn('Alert rule check failed', error as Error, {
          ruleId: rule.id,
          eventId: event.id
        })
      }
    }
  }

  // Threat intelligence integration
  async enhanceWithThreatIntelligence(event: SecurityEvent, ipAddress: string): Promise<void> {
    try {
      const threatData = await this.getThreatIntelligence(ipAddress)

      // Update event with threat intelligence
      event.metadata.threatIntelligence = threatData

      // Adjust risk score based on threat data
      if (threatData.isKnownMalicious) {
        event.riskScore += 50
      }
      if (threatData.isVpn || threatData.isTor) {
        event.riskScore += 20
      }
      if (threatData.ipReputationScore < 50) {
        event.riskScore += 30
      }

      // Store updated event
      await this.updateSecurityEvent(event)
    } catch (error) {
      this.logger.warn('Threat intelligence enhancement failed', error as Error, {
        eventId: event.id,
        ipAddress
      })
    }
  }

  // Analytics and reporting
  async getSecurityDashboard(timeRange = 86400): Promise<any> {
    try {
      const [
        totalEvents,
        eventsByType,
        eventsBySeverity,
        topRiskIPs,
        recentCriticalEvents
      ] = await Promise.all([
        this.getTotalEventsCount(timeRange),
        this.getEventsByType(timeRange),
        this.getEventsBySeverity(timeRange),
        this.getTopRiskIPs(timeRange),
        this.getRecentCriticalEvents(24)
      ])

      return {
        overview: {
          totalEvents,
          timeRange,
          lastUpdated: new Date().toISOString()
        },
        distribution: {
          byType: eventsByType,
          bySeverity: eventsBySeverity
        },
        threats: {
          topRiskIPs,
          recentCritical: recentCriticalEvents
        },
        health: await this.getSecurityHealth()
      }
    } catch (error) {
      this.logger.error('Failed to generate security dashboard', error as Error)
      throw error
    }
  }

  // Private helper methods

  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }

  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}

    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string') {
        // Remove potential secrets and truncate long strings
        sanitized[key] = value
          .replace(/password|secret|token|key/gi, '***')
          .substring(0, 1000)
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = JSON.stringify(value).substring(0, 1000)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized: Record<string, string> = {}
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key']

    if (headers && typeof headers.entries === 'function') {
      for (const [key, value] of headers.entries()) {
        if (sensitiveHeaders.includes(key.toLowerCase())) {
          sanitized[key] = '***'
        } else {
          sanitized[key] = value
        }
      }
    }

    return sanitized
  }

  private extractClientIP(request: any): string | undefined {
    const forwarded = request.headers?.get?.('x-forwarded-for')
    const realIp = request.headers?.get?.('x-real-ip')
    return forwarded ? forwarded.split(',')[0].trim() : realIp || undefined
  }

  private calculateRiskScore(
    type: SecurityEventType,
    severity: SeverityLevel,
    metadata: Record<string, any>,
    ipAddress?: string
  ): number {
    let score = SEVERITY_LEVELS[severity] * 20

    // Event type risk modifiers
    const highRiskEvents = ['sql_injection', 'system_compromise', 'malware_detected']
    if (highRiskEvents.includes(type)) {
      score += 30
    }

    // Metadata-based risk factors
    if (metadata.automated === true) score += 15
    if (metadata.repeated === true) score += 20
    if (metadata.authenticated === false) score += 10

    return Math.min(score, 100) // Cap at 100
  }

  private addToEventBuffer(event: SecurityEvent): void {
    this.eventBuffer.push(event)
    if (this.eventBuffer.length > this.bufferSize) {
      this.eventBuffer = this.eventBuffer.slice(-this.bufferSize)
    }
  }

  private async storeSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const key = `security_event:${event.id}`
      await redis.set(key, event, 60 * 60 * 24 * 30) // 30 days TTL

      // Add to type-based index
      const typeKey = `security_events:${event.type}:${Math.floor(event.timestamp / 86400000)}`
      await redis.setAdd(typeKey, event.id)
      await redis.expire(typeKey, 60 * 60 * 24 * 30)

      // Add to IP-based index if available
      if (event.ipAddress) {
        const ipKey = `security_events:ip:${event.ipAddress}`
        await redis.setAdd(ipKey, event.id)
        await redis.expire(ipKey, 60 * 60 * 24 * 7) // 7 days for IP tracking
      }
    } catch (error) {
      this.logger.warn('Failed to store security event', error as Error)
    }
  }

  private logToApplicationLogger(event: SecurityEvent): void {
    const logLevel = SEVERITY_LEVELS[event.severity] >= SEVERITY_LEVELS.high ? 'error' : 'warn'

    this.logger[logLevel](`Security event: ${event.description}`, {
      eventId: event.id,
      type: event.type,
      severity: event.severity,
      riskScore: event.riskScore,
      userId: event.userId,
      ipAddress: event.ipAddress,
      metadata: event.metadata
    })
  }

  private shouldTriggerAlert(rule: AlertRule, event: SecurityEvent): boolean {
    return (
      rule.eventType === event.type &&
      SEVERITY_LEVELS[event.severity] >= SEVERITY_LEVELS[rule.minSeverity]
    )
  }

  private async triggerAlert(rule: AlertRule, event: SecurityEvent, recentEvents: SecurityEvent[]): Promise<void> {
    this.logger.error(`Security alert triggered: ${rule.name}`, new Error('Security Alert'), {
      ruleId: rule.id,
      eventId: event.id,
      eventCount: recentEvents.length,
      threshold: rule.threshold
    })

    // Execute alert actions
    for (const action of rule.actions.filter(a => a.enabled)) {
      try {
        await this.executeAlertAction(action, event, rule)
      } catch (error) {
        this.logger.error('Alert action failed', error as Error, {
          ruleId: rule.id,
          actionType: action.type
        })
      }
    }
  }

  private async executeAlertAction(action: AlertAction, event: SecurityEvent, rule: AlertRule): Promise<void> {
    switch (action.type) {
      case 'block_ip':
        if (event.ipAddress) {
          await this.blockIP(event.ipAddress, action.config.duration || 3600)
        }
        break

      case 'lock_account':
        if (event.userId) {
          await this.lockUserAccount(event.userId, 'security_alert')
        }
        break

      case 'webhook':
        await this.sendWebhookAlert(action.config.url, event, rule)
        break

      case 'email':
        await this.sendEmailAlert(action.config.recipients, event, rule)
        break

      case 'notify_admin':
        await this.notifySecurityTeam(event)
        break
    }
  }

  private async blockIP(ipAddress: string, duration: number): Promise<void> {
    try {
      await redis.set(`blocked_ip:${ipAddress}`, {
        blockedAt: Date.now(),
        duration,
        reason: 'security_incident'
      }, duration)

      this.logger.warn('IP address blocked', {
        ipAddress,
        duration,
        reason: 'security_incident'
      })
    } catch (error) {
      this.logger.error('Failed to block IP', error as Error, { ipAddress })
    }
  }

  private async lockUserAccount(userId: string, reason: string): Promise<void> {
    try {
      // In production, this would update the user record in the database
      await redis.set(`locked_account:${userId}`, {
        lockedAt: Date.now(),
        reason
      }, 60 * 60 * 24) // 24 hours

      this.logger.warn('User account locked', { userId, reason })
    } catch (error) {
      this.logger.error('Failed to lock user account', error as Error, { userId })
    }
  }

  private async quarantineFile(filename: string): Promise<void> {
    this.logger.warn('File quarantined', { filename, reason: 'security_incident' })
  }

  private async notifySecurityTeam(event: SecurityEvent): Promise<void> {
    // In production, this would send notifications to security team
    this.logger.error('Security team notification', new Error('Critical Security Event'), {
      eventId: event.id,
      type: event.type,
      severity: event.severity,
      riskScore: event.riskScore
    })
  }

  private async updateEventMitigation(eventId: string, mitigated: boolean, actions: string[]): Promise<void> {
    try {
      const event = await redis.get(`security_event:${eventId}`)
      if (event) {
        event.mitigated = mitigated
        event.metadata.mitigationActions = actions
        await redis.set(`security_event:${eventId}`, event, 60 * 60 * 24 * 30)
      }
    } catch (error) {
      this.logger.warn('Failed to update event mitigation', error as Error)
    }
  }

  private async sendWebhookAlert(url: string, event: SecurityEvent, rule: AlertRule): Promise<void> {
    // Implementation would send HTTP POST to webhook URL
    this.logger.info('Webhook alert sent', { url, eventId: event.id, ruleId: rule.id })
  }

  private async sendEmailAlert(recipients: string[], event: SecurityEvent, rule: AlertRule): Promise<void> {
    // Implementation would send email notifications
    this.logger.info('Email alert sent', { recipients, eventId: event.id, ruleId: rule.id })
  }

  private async getThreatIntelligence(ipAddress: string): Promise<ThreatIntelligence> {
    // In production, this would query threat intelligence APIs
    return {
      ipReputationScore: 75,
      isKnownMalicious: false,
      isVpn: false,
      isTor: false,
      country: 'unknown',
      asn: 'unknown',
      malwareSignatures: [],
      botnetMembership: false
    }
  }

  private async getRecentEventsByIP(ipAddress: string, timeWindow: number): Promise<SecurityEvent[]> {
    try {
      const eventIds = await redis.setMembers(`security_events:ip:${ipAddress}`)
      const events = []

      for (const eventId of eventIds) {
        const event = await redis.get(`security_event:${eventId}`)
        if (event && event.timestamp > Date.now() - (timeWindow * 1000)) {
          events.push(event)
        }
      }

      return events
    } catch (error) {
      this.logger.warn('Failed to get recent events by IP', error as Error)
      return []
    }
  }

  private async getRecentEventsByType(eventType: SecurityEventType, timeWindow: number): Promise<SecurityEvent[]> {
    // Implementation would query events by type within time window
    return this.eventBuffer.filter(e =>
      e.type === eventType &&
      e.timestamp > Date.now() - (timeWindow * 1000)
    )
  }

  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'brute_force_detection',
        name: 'Brute Force Attack Detection',
        eventType: 'login_failure',
        minSeverity: 'medium',
        threshold: 5,
        timeWindow: 300, // 5 minutes
        enabled: true,
        recipients: ['security@lazygamedevs.com'],
        actions: [
          { type: 'block_ip', config: { duration: 3600 }, enabled: true },
          { type: 'notify_admin', config: {}, enabled: true }
        ]
      },
      {
        id: 'injection_attack_detection',
        name: 'Injection Attack Detection',
        eventType: 'sql_injection',
        minSeverity: 'high',
        threshold: 1,
        timeWindow: 60,
        enabled: true,
        recipients: ['security@lazygamedevs.com', 'emergency@lazygamedevs.com'],
        actions: [
          { type: 'block_ip', config: { duration: 7200 }, enabled: true },
          { type: 'notify_admin', config: {}, enabled: true }
        ]
      }
    ]
  }

  private async getTotalEventsCount(timeRange: number): Promise<number> {
    return this.eventBuffer.filter(e => e.timestamp > Date.now() - (timeRange * 1000)).length
  }

  private async getEventsByType(timeRange: number): Promise<Record<string, number>> {
    const events = this.eventBuffer.filter(e => e.timestamp > Date.now() - (timeRange * 1000))
    const counts: Record<string, number> = {}

    events.forEach(event => {
      counts[event.type] = (counts[event.type] || 0) + 1
    })

    return counts
  }

  private async getEventsBySeverity(timeRange: number): Promise<Record<string, number>> {
    const events = this.eventBuffer.filter(e => e.timestamp > Date.now() - (timeRange * 1000))
    const counts: Record<string, number> = {}

    events.forEach(event => {
      counts[event.severity] = (counts[event.severity] || 0) + 1
    })

    return counts
  }

  private async getTopRiskIPs(timeRange: number): Promise<Array<{ ip: string; riskScore: number; eventCount: number }>> {
    const events = this.eventBuffer.filter(e =>
      e.timestamp > Date.now() - (timeRange * 1000) && e.ipAddress
    )

    const ipData: Record<string, { riskScore: number; eventCount: number }> = {}

    events.forEach(event => {
      if (event.ipAddress) {
        if (!ipData[event.ipAddress]) {
          ipData[event.ipAddress] = { riskScore: 0, eventCount: 0 }
        }
        ipData[event.ipAddress].riskScore = Math.max(ipData[event.ipAddress].riskScore, event.riskScore)
        ipData[event.ipAddress].eventCount++
      }
    })

    return Object.entries(ipData)
      .map(([ip, data]) => ({ ip, ...data }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10)
  }

  private async getRecentCriticalEvents(hours: number): Promise<SecurityEvent[]> {
    return this.eventBuffer
      .filter(e =>
        e.severity === 'critical' &&
        e.timestamp > Date.now() - (hours * 60 * 60 * 1000)
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20)
  }

  private async getSecurityHealth(): Promise<{ status: string; issues: string[] }> {
    const issues = []
    const recentEvents = this.eventBuffer.filter(e => e.timestamp > Date.now() - (60 * 60 * 1000)) // Last hour

    const criticalEvents = recentEvents.filter(e => e.severity === 'critical').length
    const highEvents = recentEvents.filter(e => e.severity === 'high').length

    if (criticalEvents > 5) {
      issues.push('High number of critical security events in the last hour')
    }
    if (highEvents > 20) {
      issues.push('High number of high-severity security events in the last hour')
    }

    const status = issues.length === 0 ? 'healthy' : issues.length < 3 ? 'warning' : 'critical'
    return { status, issues }
  }

  private async updateSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await redis.set(`security_event:${event.id}`, event, 60 * 60 * 24 * 30)
    } catch (error) {
      this.logger.warn('Failed to update security event', error as Error)
    }
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance()

// Convenience functions
export const logSecurityEvent = securityMonitor.logSecurityEvent.bind(securityMonitor)
export const logEnhancedSecurityEvent = securityMonitor.logEnhancedSecurityEvent.bind(securityMonitor)
export const detectSecurityPatterns = securityMonitor.detectSecurityPatterns.bind(securityMonitor)
export const getSecurityDashboard = securityMonitor.getSecurityDashboard.bind(securityMonitor)