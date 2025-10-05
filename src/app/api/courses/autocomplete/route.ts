import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        suggestions: [],
        courses: [],
        instructors: [],
        tags: [],
      })
    }

    const queryLower = query.toLowerCase()

    // Get course suggestions
    const courses = await prisma.course.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        category: true,
        instructor: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
    })

    // Get instructor suggestions
    const instructors = await prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR',
        name: { contains: query, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
      take: 5,
    })

    // Get tag suggestions
    const tags = await prisma.courseTag.findMany({
      where: {
        tag: { contains: query, mode: 'insensitive' },
        course: {
          published: true,
        },
      },
      select: {
        tag: true,
      },
      distinct: ['tag'],
      take: 5,
    })

    // Create combined suggestions
    const suggestions: Array<{
      type: 'course' | 'instructor' | 'tag' | 'category'
      value: string
      label: string
      metadata?: any
    }> = []

    // Add course suggestions
    courses.forEach((course) => {
      suggestions.push({
        type: 'course',
        value: course.id,
        label: course.title,
        metadata: {
          thumbnail: course.thumbnail,
          instructor: course.instructor.name,
          category: course.category,
        },
      })
    })

    // Add instructor suggestions
    instructors.forEach((instructor) => {
      if (instructor.name) {
        suggestions.push({
          type: 'instructor',
          value: instructor.id,
          label: instructor.name,
          metadata: {
            avatar: instructor.avatar,
          },
        })
      }
    })

    // Add tag suggestions
    tags.forEach((tag) => {
      suggestions.push({
        type: 'tag',
        value: tag.tag,
        label: tag.tag,
      })
    })

    // Add category suggestions if query matches
    const categories = [
      { value: 'unity-development', label: 'Unity Development' },
      { value: 'unreal-development', label: 'Unreal Engine' },
      { value: 'godot-development', label: 'Godot' },
      { value: 'game-programming', label: 'Game Programming' },
      { value: 'game-design', label: 'Game Design' },
      { value: 'mobile-games', label: 'Mobile Games' },
      { value: 'web-games', label: 'Web Games' },
      { value: 'vr-ar-games', label: 'VR/AR Games' },
    ]

    categories.forEach((category) => {
      if (category.label.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: 'category',
          value: category.value,
          label: category.label,
        })
      }
    })

    return NextResponse.json({
      suggestions: suggestions.slice(0, limit),
      courses: courses.slice(0, 5),
      instructors,
      tags: tags.map((t) => t.tag),
    })
  } catch (error) {
    console.error('Autocomplete error:', error)
    return NextResponse.json(
      { error: 'Failed to get autocomplete suggestions' },
      { status: 500 }
    )
  }
}
