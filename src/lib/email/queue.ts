/**
 * Email Queue System with BullMQ
 */
import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { renderEmailTemplate } from './templates/registry';
import { sendEmail } from './service';
import { EmailTemplateKey, EmailTemplateData, EmailCategory, SendEmailOptions } from './types';

// Email job data interface
export interface EmailJobData {
  recipient: string | string[];
  templateKey?: EmailTemplateKey;
  templateData?: EmailTemplateData;
  subject?: string;
  html?: string;
  text?: string;
  category?: EmailCategory;
  correlationId?: string;
  dedupeKey?: string;
  scheduledFor?: Date;
}

// Queue configuration
const QUEUE_NAME = 'emails';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const ENABLE_QUEUE = process.env.ENABLE_EMAIL_QUEUE !== 'false';

// Redis connection (with error handling)
let redisConnection: Redis | null = null;
let emailQueue: Queue<EmailJobData> | null = null;
let emailWorker: Worker<EmailJobData> | null = null;

function createRedisConnection(): Redis | null {
  if (!ENABLE_QUEUE) return null;
  
  try {
    const connection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    
    connection.on('error', (err) => {
      console.warn('[Email Queue] Redis connection error:', err.message);
    });
    
    return connection;
  } catch (error) {
    console.warn('[Email Queue] Failed to create Redis connection:', error);
    return null;
  }
}

// Initialize queue
export function getEmailQueue(): Queue<EmailJobData> | null {
  if (!ENABLE_QUEUE) return null;
  
  if (!emailQueue) {
    try {
      if (!redisConnection) {
        redisConnection = createRedisConnection();
      }
      
      if (redisConnection) {
        emailQueue = new Queue<EmailJobData>(QUEUE_NAME, {
          connection: redisConnection,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: { count: 100, age: 24 * 3600 },
            removeOnFail: { count: 1000, age: 7 * 24 * 3600 },
          },
        });
      }
    } catch (error) {
      console.warn('[Email Queue] Failed to initialize queue:', error);
      emailQueue = null;
    }
  }
  
  return emailQueue;
}

// Queue email job
export async function queueEmail(jobData: EmailJobData): Promise<Job<EmailJobData> | null> {
  const queue = getEmailQueue();
  
  // Fallback to direct send if queue unavailable
  if (!queue) {
    console.log('[Email Queue] Queue unavailable, sending directly');
    await sendEmailDirect(jobData);
    return null;
  }
  
  try {
    const job = await queue.add('send-email', jobData, {
      jobId: jobData.dedupeKey,
      delay: jobData.scheduledFor ? jobData.scheduledFor.getTime() - Date.now() : undefined,
    });
    
    console.log(`[Email Queue] Job queued: ${job.id}`);
    return job;
  } catch (error) {
    console.error('[Email Queue] Error queuing job:', error);
    // Fallback to direct send
    await sendEmailDirect(jobData);
    return null;
  }
}

// Direct email send (fallback)
async function sendEmailDirect(jobData: EmailJobData): Promise<void> {
  try {
    let html = jobData.html;
    let text = jobData.text;
    let subject = jobData.subject;
    let category = jobData.category;
    
    // Render template if provided
    if (jobData.templateKey && jobData.templateData) {
      const rendered = await renderEmailTemplate(
        jobData.templateKey,
        jobData.templateData,
        jobData.subject
      );
      html = rendered.html;
      text = rendered.text;
      subject = rendered.subject;
      category = rendered.category;
    }
    
    if (!html || !subject) {
      throw new Error('Missing required email fields: html or subject');
    }
    
    const options: SendEmailOptions = {
      to: jobData.recipient,
      subject,
      html,
      text,
      category,
      correlationId: jobData.correlationId,
    };
    
    await sendEmail(options);
  } catch (error) {
    console.error('[Email Queue] Error sending email directly:', error);
    throw error;
  }
}

// Initialize worker
export function startEmailWorker(): Worker<EmailJobData> | null {
  if (!ENABLE_QUEUE) return null;
  
  if (emailWorker) {
    console.log('[Email Queue] Worker already running');
    return emailWorker;
  }
  
  try {
    if (!redisConnection) {
      redisConnection = createRedisConnection();
    }
    
    if (!redisConnection) {
      console.warn('[Email Queue] Cannot start worker without Redis');
      return null;
    }
    
    emailWorker = new Worker<EmailJobData>(
      QUEUE_NAME,
      async (job: Job<EmailJobData>) => {
        console.log(`[Email Queue] Processing job ${job.id}`);
        await sendEmailDirect(job.data);
      },
      {
        connection: redisConnection,
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000,
        },
      }
    );
    
    emailWorker.on('completed', (job) => {
      console.log(`[Email Queue] Job ${job.id} completed`);
    });
    
    emailWorker.on('failed', (job, err) => {
      console.error(`[Email Queue] Job ${job?.id} failed:`, err);
    });
    
    console.log('[Email Queue] Worker started successfully');
    return emailWorker;
  } catch (error) {
    console.warn('[Email Queue] Failed to start worker:', error);
    return null;
  }
}

// Stop worker
export async function stopEmailWorker(): Promise<void> {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
    console.log('[Email Queue] Worker stopped');
  }
}

// Close connections
export async function closeEmailQueue(): Promise<void> {
  if (emailQueue) {
    await emailQueue.close();
    emailQueue = null;
  }
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }
  console.log('[Email Queue] Connections closed');
}

// Helper: Send using template
export async function queueTemplateEmail(
  recipient: string | string[],
  templateKey: EmailTemplateKey,
  templateData: EmailTemplateData,
  options?: {
    subject?: string;
    correlationId?: string;
    dedupeKey?: string;
    scheduledFor?: Date;
  }
): Promise<Job<EmailJobData> | null> {
  return queueEmail({
    recipient,
    templateKey,
    templateData,
    subject: options?.subject,
    correlationId: options?.correlationId || `email-${Date.now()}`,
    dedupeKey: options?.dedupeKey,
    scheduledFor: options?.scheduledFor,
  });
}

