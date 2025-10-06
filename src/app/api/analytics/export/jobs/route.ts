import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobs = await prisma.exportJob.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50 jobs
    });

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      type: job.type.toLowerCase(),
      format: job.format.toLowerCase(),
      status: job.status.toLowerCase(),
      progress: job.progress,
      fileUrl: job.fileUrl,
      fileSize: job.fileSize,
      error: job.error,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
    });
  } catch (error) {
    console.error('Failed to fetch export jobs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch export jobs',
      },
      { status: 500 }
    );
  }
}