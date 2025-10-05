import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createQuestionSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(5000),
});

export async function GET(req: NextRequest, { params }: { params: { lessonId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort') || 'newest';

    const orderBy = sort === 'top' ? { upvotes: 'desc' } : sort === 'resolved' ? { resolved: 'desc' } : { createdAt: 'desc' };

    const questions = await prisma.lessonQuestion.findMany({
      where: { lessonId: params.lessonId },
      include: { user: { select: { id: true, name: true, image: true } }, answers: { include: { user: { select: { name: true, image: true } } }, orderBy: { createdAt: 'asc' } } },
      orderBy,
    });

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { lessonId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const data = createQuestionSchema.parse(body);

    const question = await prisma.lessonQuestion.create({
      data: { ...data, userId, lessonId: params.lessonId },
      include: { user: { select: { name: true, image: true } } },
    });

    return NextResponse.json({ success: true, question }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
