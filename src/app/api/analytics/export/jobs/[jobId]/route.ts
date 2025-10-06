import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    jobId: string;
  };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { jobId } = params;

    // Check if the job belongs to the user
    const job = await prisma.exportJob.findFirst({
      where: {
        id: jobId,
        userId,
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Delete the job
    await prisma.exportJob.delete({
      where: { id: jobId },
    });

    return NextResponse.json({
      success: true,
      message: 'Export job deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete export job:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete export job',
      },
      { status: 500 }
    );
  }
}