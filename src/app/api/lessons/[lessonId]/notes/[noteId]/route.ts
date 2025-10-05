import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateNoteSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  timecode: z.number().int().min(0).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { lessonId: string; noteId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify note exists and belongs to user
    const existingNote = await prisma.lessonNote.findFirst({
      where: {
        id: params.noteId,
        userId,
        lessonId: params.lessonId,
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateNoteSchema.parse(body);

    const updatedNote = await prisma.lessonNote.update({
      where: { id: params.noteId },
      data: {
        ...(validatedData.content !== undefined && { content: validatedData.content }),
        ...(validatedData.timecode !== undefined && { timecode: validatedData.timecode }),
      },
    });

    return NextResponse.json({ success: true, note: updatedNote });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { lessonId: string; noteId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify note exists and belongs to user
    const existingNote = await prisma.lessonNote.findFirst({
      where: {
        id: params.noteId,
        userId,
        lessonId: params.lessonId,
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    await prisma.lessonNote.delete({
      where: { id: params.noteId },
    });

    return NextResponse.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
