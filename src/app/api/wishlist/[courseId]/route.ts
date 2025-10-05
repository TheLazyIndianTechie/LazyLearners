import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/wishlist/[courseId] - Remove course from wishlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId } = params

    // Find the wishlist item
    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    })

    if (!wishlistItem) {
      return NextResponse.json(
        { error: 'Course not found in wishlist' },
        { status: 404 }
      )
    }

    // Remove from wishlist
    await prisma.wishlist.delete({
      where: {
        id: wishlistItem.id,
      },
    })

    return NextResponse.json({
      message: 'Course removed from wishlist',
      courseId,
    })
  } catch (error) {
    console.error('Remove from wishlist error:', error)
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    )
  }
}

// GET /api/wishlist/[courseId] - Check if course is in wishlist
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ isInWishlist: false })
    }

    const { courseId } = params

    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    })

    return NextResponse.json({
      isInWishlist: !!wishlistItem,
      addedAt: wishlistItem?.createdAt || null,
    })
  } catch (error) {
    console.error('Check wishlist error:', error)
    return NextResponse.json(
      { error: 'Failed to check wishlist status' },
      { status: 500 }
    )
  }
}
