import { EventEmitter } from 'events'
import { createRequestLogger } from '@/lib/logger'
import { redis } from '@/lib/redis'

const logger = createRequestLogger({ headers: new Headers() } as any)

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused'

export interface JobData {
  [key: string]: any
}

export interface JobOptions {
  attempts?: number
  backoff?: {
    type: 'fixed' | 'exponential'
    delay: number
  }
  timeout?: number
  priority?: number
  delay?: number
  removeOnComplete?: boolean
  removeOnFail?: boolean
}

export interface Job<T = any> {
  id: string
  data: T
  status: JobStatus
  progress: number
  attempts: number
  maxAttempts: number
  error?: string
  result?: any
  createdAt: number
  startedAt?: number
  completedAt?: number
  failedAt?: number
  processedOn?: string
  priority: number
  timeout?: number
  backoff?: JobOptions['backoff']
}

export interface QueueOptions {
  concurrency?: number
  defaultJobOptions?: JobOptions
  redis?: boolean
  redisPrefix?: string
}

export interface ProcessCallback<T = any> {
  (job: Job<T>): Promise<any>
}

export class Queue<T extends JobData = any> extends EventEmitter {
  private name: string
  private jobs: Map<string, Job<T>> = new Map()
  private waitingJobs: string[] = []
  private activeJobs: Set<string> = new Set()
  private completedJobs: Set<string> = new Set()
  private failedJobs: Set<string> = new Set()
  private processors: ProcessCallback<T>[] = []
  private concurrency: number
  private defaultJobOptions: Required<JobOptions>
  private useRedis: boolean
  private redisPrefix: string
  private paused: boolean = false
  private processing: boolean = false

  constructor(name: string, options: QueueOptions = {}) {
    super()
    this.name = name
    this.concurrency = options.concurrency || 1
    this.useRedis = options.redis ?? false
    this.redisPrefix = options.redisPrefix || 'queue'

    this.defaultJobOptions = {
      attempts: options.defaultJobOptions?.attempts || 3,
      backoff: options.defaultJobOptions?.backoff || { type: 'exponential', delay: 1000 },
      timeout: options.defaultJobOptions?.timeout || 30000,
      priority: options.defaultJobOptions?.priority || 0,
      delay: options.defaultJobOptions?.delay || 0,
      removeOnComplete: options.defaultJobOptions?.removeOnComplete ?? false,
      removeOnFail: options.defaultJobOptions?.removeOnFail ?? false
    }

    logger.info('Queue initialized', {
      name: this.name,
      concurrency: this.concurrency,
      useRedis: this.useRedis
    })
  }

  /**
   * Add a job to the queue
   */
  async add(data: T, options?: JobOptions): Promise<Job<T>> {
    const jobId = this.generateJobId()
    const jobOptions = { ...this.defaultJobOptions, ...options }

    const job: Job<T> = {
      id: jobId,
      data,
      status: jobOptions.delay && jobOptions.delay > 0 ? 'delayed' : 'waiting',
      progress: 0,
      attempts: 0,
      maxAttempts: jobOptions.attempts,
      createdAt: Date.now(),
      priority: jobOptions.priority,
      timeout: jobOptions.timeout,
      backoff: jobOptions.backoff
    }

    this.jobs.set(jobId, job)

    if (jobOptions.delay && jobOptions.delay > 0) {
      // Schedule job for later
      setTimeout(() => {
        const delayedJob = this.jobs.get(jobId)
        if (delayedJob && delayedJob.status === 'delayed') {
          delayedJob.status = 'waiting'
          this.waitingJobs.push(jobId)
          this.sortWaitingJobs()
          this.emit('waiting', delayedJob)
          this.processNextJobs()
        }
      }, jobOptions.delay)
    } else {
      this.waitingJobs.push(jobId)
      this.sortWaitingJobs()
      this.emit('waiting', job)
    }

    // Persist to Redis if enabled
    if (this.useRedis) {
      await this.persistJob(job)
    }

    logger.debug('Job added to queue', {
      queueName: this.name,
      jobId,
      priority: job.priority,
      status: job.status
    })

    // Start processing
    this.processNextJobs()

    return job
  }

  /**
   * Process jobs with a callback function
   */
  process(concurrency: number | ProcessCallback<T>, callback?: ProcessCallback<T>): void {
    if (typeof concurrency === 'function') {
      callback = concurrency
      concurrency = this.concurrency
    }

    if (!callback) {
      throw new Error('Process callback is required')
    }

    this.concurrency = concurrency as number
    this.processors.push(callback)

    logger.info('Processor registered', {
      queueName: this.name,
      concurrency: this.concurrency,
      processors: this.processors.length
    })

    // Start processing immediately
    this.processNextJobs()
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job<T> | null> {
    let job = this.jobs.get(jobId)

    if (!job && this.useRedis) {
      job = await this.loadJob(jobId)
      if (job) {
        this.jobs.set(jobId, job)
      }
    }

    return job || null
  }

  /**
   * Get all jobs with optional status filter
   */
  async getJobs(status?: JobStatus | JobStatus[]): Promise<Job<T>[]> {
    const allJobs = Array.from(this.jobs.values())

    if (!status) {
      return allJobs
    }

    const statuses = Array.isArray(status) ? status : [status]
    return allJobs.filter(job => statuses.includes(job.status))
  }

  /**
   * Get job counts by status
   */
  async getJobCounts(): Promise<Record<JobStatus, number>> {
    const jobs = Array.from(this.jobs.values())

    return {
      waiting: jobs.filter(j => j.status === 'waiting').length,
      active: jobs.filter(j => j.status === 'active').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      delayed: jobs.filter(j => j.status === 'delayed').length,
      paused: jobs.filter(j => j.status === 'paused').length
    }
  }

  /**
   * Remove a job from the queue
   */
  async removeJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId)
    if (!job) return false

    // Remove from waiting queue
    const waitingIndex = this.waitingJobs.indexOf(jobId)
    if (waitingIndex > -1) {
      this.waitingJobs.splice(waitingIndex, 1)
    }

    // Remove from active jobs
    this.activeJobs.delete(jobId)
    this.completedJobs.delete(jobId)
    this.failedJobs.delete(jobId)

    // Remove from map
    this.jobs.delete(jobId)

    // Remove from Redis
    if (this.useRedis) {
      await this.removeJobFromRedis(jobId)
    }

    this.emit('removed', job)
    return true
  }

  /**
   * Pause the queue
   */
  pause(): void {
    this.paused = true
    logger.info('Queue paused', { queueName: this.name })
    this.emit('paused')
  }

  /**
   * Resume the queue
   */
  resume(): void {
    this.paused = false
    logger.info('Queue resumed', { queueName: this.name })
    this.emit('resumed')
    this.processNextJobs()
  }

  /**
   * Clean completed or failed jobs
   */
  async clean(grace: number, status: 'completed' | 'failed' = 'completed'): Promise<string[]> {
    const cutoffTime = Date.now() - grace
    const jobsToRemove: string[] = []

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status !== status) continue

      const timestamp = status === 'completed' ? job.completedAt : job.failedAt
      if (timestamp && timestamp < cutoffTime) {
        jobsToRemove.push(jobId)
      }
    }

    // Remove jobs
    await Promise.all(jobsToRemove.map(jobId => this.removeJob(jobId)))

    logger.info('Queue cleaned', {
      queueName: this.name,
      status,
      removed: jobsToRemove.length
    })

    return jobsToRemove
  }

  /**
   * Close the queue and stop processing
   */
  async close(): Promise<void> {
    this.paused = true
    this.processors = []

    // Wait for active jobs to complete
    while (this.activeJobs.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    logger.info('Queue closed', { queueName: this.name })
    this.emit('closed')
  }

  /**
   * Process next available jobs
   */
  private async processNextJobs(): Promise<void> {
    if (this.paused || this.processors.length === 0) {
      return
    }

    // Process jobs up to concurrency limit
    while (
      this.activeJobs.size < this.concurrency &&
      this.waitingJobs.length > 0
    ) {
      const jobId = this.waitingJobs.shift()
      if (!jobId) break

      const job = this.jobs.get(jobId)
      if (!job || job.status !== 'waiting') continue

      this.processJob(job)
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job<T>): Promise<void> {
    if (this.processors.length === 0) return

    const processor = this.processors[0] // Use first processor (can be extended for multiple)

    job.status = 'active'
    job.startedAt = Date.now()
    job.attempts++
    this.activeJobs.add(job.id)

    this.emit('active', job)
    logger.debug('Job processing started', {
      queueName: this.name,
      jobId: job.id,
      attempt: job.attempts
    })

    // Set timeout
    const timeoutId = job.timeout
      ? setTimeout(() => {
          this.handleJobFailure(job, new Error('Job timeout exceeded'))
        }, job.timeout)
      : null

    try {
      // Execute processor
      const result = await processor(job)

      // Clear timeout
      if (timeoutId) clearTimeout(timeoutId)

      // Mark as completed
      job.status = 'completed'
      job.result = result
      job.completedAt = Date.now()
      job.progress = 100

      this.activeJobs.delete(job.id)
      this.completedJobs.add(job.id)

      if (this.useRedis) {
        await this.persistJob(job)
      }

      this.emit('completed', job, result)
      logger.info('Job completed successfully', {
        queueName: this.name,
        jobId: job.id,
        duration: job.completedAt - job.startedAt!
      })

      // Remove if configured
      if (this.defaultJobOptions.removeOnComplete) {
        await this.removeJob(job.id)
      }
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId)
      await this.handleJobFailure(job, error as Error)
    } finally {
      // Process next job
      this.processNextJobs()
    }
  }

  /**
   * Handle job failure with retry logic
   */
  private async handleJobFailure(job: Job<T>, error: Error): Promise<void> {
    job.error = error.message
    this.activeJobs.delete(job.id)

    logger.warn('Job failed', error, {
      queueName: this.name,
      jobId: job.id,
      attempt: job.attempts,
      maxAttempts: job.maxAttempts
    })

    // Check if we should retry
    if (job.attempts < job.maxAttempts) {
      // Calculate backoff delay
      const delay = job.backoff
        ? job.backoff.type === 'exponential'
          ? job.backoff.delay * Math.pow(2, job.attempts - 1)
          : job.backoff.delay
        : 0

      // Retry the job
      job.status = delay > 0 ? 'delayed' : 'waiting'

      if (delay > 0) {
        setTimeout(() => {
          const retryJob = this.jobs.get(job.id)
          if (retryJob && retryJob.status === 'delayed') {
            retryJob.status = 'waiting'
            this.waitingJobs.push(job.id)
            this.sortWaitingJobs()
            this.processNextJobs()
          }
        }, delay)
      } else {
        this.waitingJobs.push(job.id)
        this.sortWaitingJobs()
      }

      this.emit('retrying', job, error)
    } else {
      // Max attempts reached, mark as failed
      job.status = 'failed'
      job.failedAt = Date.now()
      this.failedJobs.add(job.id)

      if (this.useRedis) {
        await this.persistJob(job)
      }

      this.emit('failed', job, error)

      // Remove if configured
      if (this.defaultJobOptions.removeOnFail) {
        await this.removeJob(job.id)
      }
    }
  }

  /**
   * Sort waiting jobs by priority (higher first)
   */
  private sortWaitingJobs(): void {
    this.waitingJobs.sort((a, b) => {
      const jobA = this.jobs.get(a)
      const jobB = this.jobs.get(b)
      if (!jobA || !jobB) return 0
      return jobB.priority - jobA.priority
    })
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `${this.name}:${Date.now()}:${Math.random().toString(36).substring(2, 10)}`
  }

  /**
   * Persist job to Redis
   */
  private async persistJob(job: Job<T>): Promise<void> {
    try {
      const key = `${this.redisPrefix}:${this.name}:job:${job.id}`
      await redis.set(key, job, 60 * 60 * 24 * 7) // 7 days
    } catch (error) {
      logger.warn('Failed to persist job to Redis', error as Error, {
        jobId: job.id
      })
    }
  }

  /**
   * Load job from Redis
   */
  private async loadJob(jobId: string): Promise<Job<T> | null> {
    try {
      const key = `${this.redisPrefix}:${this.name}:job:${jobId}`
      return await redis.get<Job<T>>(key)
    } catch (error) {
      logger.warn('Failed to load job from Redis', error as Error, {
        jobId
      })
      return null
    }
  }

  /**
   * Remove job from Redis
   */
  private async removeJobFromRedis(jobId: string): Promise<void> {
    try {
      const key = `${this.redisPrefix}:${this.name}:job:${jobId}`
      await redis.del(key)
    } catch (error) {
      logger.warn('Failed to remove job from Redis', error as Error, {
        jobId
      })
    }
  }
}

/**
 * Create a new queue instance
 */
export function createQueue<T extends JobData = any>(
  name: string,
  options?: QueueOptions
): Queue<T> {
  return new Queue<T>(name, options)
}
