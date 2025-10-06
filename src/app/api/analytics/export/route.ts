import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ExportType, ExportFormat, ExportStatus } from "@prisma/client";

const exportRequestSchema = z.object({
  type: z.enum(['posthog', 'metabase', 'revenue', 'video', 'performance']),
  resourceId: z.string().optional(),
  format: z.enum(['csv', 'pdf', 'json', 'xlsx']),
  filters: z.record(z.any()).optional(),
  async: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const payload = exportRequestSchema.parse(json);

    // Create export job in database
    const job = await prisma.exportJob.create({
      data: {
        userId,
        type: payload.type.toUpperCase() as ExportType,
        resourceId: payload.resourceId,
        format: payload.format.toUpperCase() as ExportFormat,
        filters: payload.filters ? JSON.stringify(payload.filters) : null,
        status: ExportStatus.PENDING,
        progress: 0,
      },
    });

    // Start async processing
    processExportJob(job.id);

    if (payload.async) {
      return NextResponse.json({
        success: true,
        jobId: job.id,
        status: 'pending',
        message: 'Export job queued for processing',
      });
    } else {
      // For synchronous exports, wait for completion (with timeout)
      const result = await waitForJobCompletion(job.id, 30000); // 30 second timeout

      if (result.status === ExportStatus.COMPLETED && result.fileUrl) {
        return NextResponse.json({
          success: true,
          downloadUrl: result.fileUrl,
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

  const job = await prisma.exportJob.findFirst({
    where: {
      id: jobId,
      userId, // Ensure user can only access their own jobs
    },
  });

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
      status: job.status.toLowerCase(),
      progress: job.progress,
      downloadUrl: job.fileUrl,
      error: job.error,
    },
  });
}

async function processExportJob(jobId: string) {
  try {
    // Update job status to processing
    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: ExportStatus.PROCESSING,
        progress: 10,
      },
    });

    const job = await prisma.exportJob.findUnique({
      where: { id: jobId },
    });

    if (!job) return;

    // Update progress
    await prisma.exportJob.update({
      where: { id: jobId },
      data: { progress: 25 },
    });

    let exportUrl: string;

    switch (job.type) {
      case ExportType.POSTHOG:
        exportUrl = await processPosthogExport(job);
        break;
      case ExportType.METABASE:
        exportUrl = await processMetabaseExport(job);
        break;
      case ExportType.REVENUE:
        exportUrl = await processRevenueExport(job);
        break;
      case ExportType.VIDEO:
        exportUrl = await processVideoExport(job);
        break;
      case ExportType.PERFORMANCE:
        exportUrl = await processPerformanceExport(job);
        break;
      default:
        throw new Error(`Unsupported export type: ${job.type}`);
    }

    // Update progress and complete job
    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: ExportStatus.COMPLETED,
        progress: 100,
        fileUrl: exportUrl,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: ExportStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

async function processPosthogExport(job: any): Promise<string> {
  // Update progress
  await prisma.exportJob.update({
    where: { id: job.id },
    data: { progress: 50 },
  });

  const apiKey = process.env.POSTHOG_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiHost = process.env.POSTHOG_API_HOST?.replace(/\/+$/, "") ?? "https://us.i.posthog.com";

  if (!apiKey || !projectId) {
    throw new Error('PostHog configuration missing');
  }

  // This would make actual API calls to PostHog to generate exports
  // For now, return a placeholder URL
  const format = job.format.toLowerCase();
  return `${apiHost}/api/projects/${projectId}/insights/${job.resourceId}/export/?format=${format}`;
}

async function processMetabaseExport(job: any): Promise<string> {
  // Update progress
  await prisma.exportJob.update({
    where: { id: job.id },
    data: { progress: 50 },
  });

  const siteUrl = process.env.METABASE_SITE_URL;

  if (!siteUrl) {
    throw new Error('Metabase configuration missing');
  }

  // This would make actual API calls to Metabase to generate exports
  // For now, return a placeholder URL
  const format = job.format.toLowerCase();
  return `${siteUrl}/api/dashboard/${job.resourceId}/export/${format}`;
}

async function processRevenueExport(job: any): Promise<string> {
  // Update progress
  await prisma.exportJob.update({
    where: { id: job.id },
    data: { progress: 50 },
  });

  // Fetch revenue data from analytics API
  const filters = job.filters ? JSON.parse(job.filters) : {};
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/analytics/revenue?${new URLSearchParams({
    startDate: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: filters.endDate || new Date().toISOString(),
    ...(filters.courseIds && { courseIds: filters.courseIds.join(',') }),
  })}`);

  if (!response.ok) {
    throw new Error('Failed to fetch revenue data');
  }

  const data = await response.json();

  // Generate export file based on format
  const exportUrl = await generateExportFile(job, data);
  return exportUrl;
}

async function processVideoExport(job: any): Promise<string> {
  // Update progress
  await prisma.exportJob.update({
    where: { id: job.id },
    data: { progress: 50 },
  });

  // Fetch video analytics data
  const filters = job.filters ? JSON.parse(job.filters) : {};
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/analytics/video?${new URLSearchParams({
    startDate: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: filters.endDate || new Date().toISOString(),
    ...(filters.courseId && { courseId: filters.courseId }),
    ...(filters.videoId && { videoId: filters.videoId }),
  })}`);

  if (!response.ok) {
    throw new Error('Failed to fetch video analytics data');
  }

  const data = await response.json();

  // Generate export file based on format
  const exportUrl = await generateExportFile(job, data);
  return exportUrl;
}

async function processPerformanceExport(job: any): Promise<string> {
  // Update progress
  await prisma.exportJob.update({
    where: { id: job.id },
    data: { progress: 50 },
  });

  // Fetch performance data from analytics API
  const filters = job.filters ? JSON.parse(job.filters) : {};
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/analytics/performance?${new URLSearchParams({
    startDate: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: filters.endDate || new Date().toISOString(),
    ...(filters.courseIds && { courseIds: filters.courseIds.join(',') }),
  })}`);

  if (!response.ok) {
    throw new Error('Failed to fetch performance data');
  }

  const data = await response.json();

  // Generate export file based on format
  const exportUrl = await generateExportFile(job, data);
  return exportUrl;
}

async function generateExportFile(job: any, data: any): Promise<string> {
  // Update progress
  await prisma.exportJob.update({
    where: { id: job.id },
    data: { progress: 75 },
  });

  // In a real implementation, this would generate the actual file
  // For now, we'll create a mock file URL
  const fileName = `export_${job.type.toLowerCase()}_${job.id}.${job.format.toLowerCase()}`;
  const fileUrl = `/api/exports/${fileName}`;

  // Simulate file generation delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Update progress
  await prisma.exportJob.update({
    where: { id: job.id },
    data: { progress: 90 },
  });

  return fileUrl;
}

async function waitForJobCompletion(jobId: string, timeoutMs: number): Promise<any> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkJob = async () => {
      const job = await prisma.exportJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        reject(new Error('Job not found'));
        return;
      }

      if (job.status === ExportStatus.COMPLETED || job.status === ExportStatus.FAILED) {
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