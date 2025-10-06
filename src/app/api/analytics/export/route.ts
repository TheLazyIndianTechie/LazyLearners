import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const exportRequestSchema = z.object({
  type: z.enum(['posthog', 'metabase']),
  resourceId: z.string().min(1),
  format: z.enum(['csv', 'pdf']),
  filters: z.record(z.any()).optional(),
  async: z.boolean().optional(),
});

interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  type: 'posthog' | 'metabase';
  resourceId: string;
  format: 'csv' | 'pdf';
  filters: Record<string, any>;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  error?: string;
}

// In-memory job store (in production, use a database)
const exportJobs = new Map<string, ExportJob>();

export async function POST(request: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const payload = exportRequestSchema.parse(json);

    const jobId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: ExportJob = {
      id: jobId,
      status: 'pending',
      type: payload.type,
      resourceId: payload.resourceId,
      format: payload.format,
      filters: payload.filters || {},
      createdAt: new Date().toISOString(),
    };

    exportJobs.set(jobId, job);

    // Start async processing
    processExportJob(jobId);

    if (payload.async) {
      return NextResponse.json({
        success: true,
        jobId,
        status: 'pending',
        message: 'Export job queued for processing',
      });
    } else {
      // For synchronous exports, wait for completion (with timeout)
      const result = await waitForJobCompletion(jobId, 30000); // 30 second timeout

      if (result.status === 'completed' && result.downloadUrl) {
        return NextResponse.json({
          success: true,
          downloadUrl: result.downloadUrl,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || 'Export failed',
        }, { status: 500 });
      }
    }
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Invalid request payload."
        : error instanceof Error
          ? error.message
          : "Failed to start export.";

    const status = error instanceof z.ZodError ? 400 : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}

export async function GET(request: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const jobId = url.searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({
      success: false,
      error: 'jobId parameter is required',
    }, { status: 400 });
  }

  const job = exportJobs.get(jobId);

  if (!job) {
    return NextResponse.json({
      success: false,
      error: 'Job not found',
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    job: {
      id: job.id,
      status: job.status,
      progress: getJobProgress(job),
      downloadUrl: job.downloadUrl,
      error: job.error,
    },
  });
}

async function processExportJob(jobId: string) {
  const job = exportJobs.get(jobId);
  if (!job) return;

  try {
    job.status = 'processing';
    exportJobs.set(jobId, job);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (job.type === 'posthog') {
      // Process PostHog export
      const exportUrl = await processPosthogExport(job);
      job.downloadUrl = exportUrl;
    } else if (job.type === 'metabase') {
      // Process Metabase export
      const exportUrl = await processMetabaseExport(job);
      job.downloadUrl = exportUrl;
    }

    job.status = 'completed';
    job.completedAt = new Date().toISOString();
  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
  }

  exportJobs.set(jobId, job);
}

async function processPosthogExport(job: ExportJob): Promise<string> {
  // Placeholder - integrate with PostHog export API
  const apiKey = process.env.POSTHOG_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiHost = process.env.POSTHOG_API_HOST?.replace(/\/+$/, "") ?? "https://us.i.posthog.com";

  if (!apiKey || !projectId) {
    throw new Error('PostHog configuration missing');
  }

  // This would make actual API calls to PostHog to generate exports
  // For now, return a placeholder URL
  return `${apiHost}/api/projects/${projectId}/insights/${job.resourceId}/export/?format=${job.format}`;
}

async function processMetabaseExport(job: ExportJob): Promise<string> {
  // Placeholder - integrate with Metabase export API
  const siteUrl = process.env.METABASE_SITE_URL;

  if (!siteUrl) {
    throw new Error('Metabase configuration missing');
  }

  // This would make actual API calls to Metabase to generate exports
  // For now, return a placeholder URL
  return `${siteUrl}/api/dashboard/${job.resourceId}/export/${job.format}`;
}

function getJobProgress(job: ExportJob): number {
  switch (job.status) {
    case 'pending': return 0;
    case 'processing': return 50;
    case 'completed': return 100;
    case 'failed': return 0;
    default: return 0;
  }
}

async function waitForJobCompletion(jobId: string, timeoutMs: number): Promise<ExportJob> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkJob = () => {
      const job = exportJobs.get(jobId);

      if (!job) {
        reject(new Error('Job not found'));
        return;
      }

      if (job.status === 'completed' || job.status === 'failed') {
        resolve(job);
        return;
      }

      if (Date.now() - startTime > timeoutMs) {
        reject(new Error('Export timeout'));
        return;
      }

      setTimeout(checkJob, 500);
    };

    checkJob();
  });
}