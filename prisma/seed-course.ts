import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCourse() {
  console.log('🌱 Seeding Unity course...')

  try {
    // First, create or find an instructor user
    const instructor = await prisma.user.upsert({
      where: { email: 'alex@gamelearn.com' },
      update: {},
      create: {
        id: 'inst-1',
        name: 'Alex Johnson',
        email: 'alex@gamelearn.com',
        role: 'INSTRUCTOR',
        bio: 'Senior Unity developer with 10+ years of experience in the gaming industry. Published over 15 successful mobile games.',
        image: '/api/placeholder/80/80',
      },
    })

    console.log('✅ Instructor created/found:', instructor.name)

    // Create the Unity course
    const course = await prisma.course.upsert({
      where: { id: '1' },
      update: {},
      create: {
        id: '1',
        title: 'Complete Unity Game Development Course',
        description: 'Learn Unity from scratch and build 10 complete games. Master C# programming, game physics, UI design, and publishing to multiple platforms.',
        thumbnail: '/api/placeholder/800/450',
        price: 89.99,
        published: true,
        category: 'UNITY_DEVELOPMENT',
        engine: 'UNITY',
        difficulty: 'BEGINNER',
        duration: 2400, // 40 hours
        instructorId: instructor.id,
      },
    })

    console.log('✅ Course created/found:', course.title)

    // Add course requirements
    const requirements = [
      'Basic computer skills',
      'Windows or Mac computer',
      'Unity 2022.3 LTS (free)',
    ]

    for (let i = 0; i < requirements.length; i++) {
      await prisma.courseRequirement.upsert({
        where: {
          courseId_requirement: {
            courseId: course.id,
            requirement: requirements[i],
          },
        },
        update: {},
        create: {
          requirement: requirements[i],
          order: i + 1,
          courseId: course.id,
        },
      })
    }

    // Add course objectives
    const objectives = [
      'Master Unity interface and workflow',
      'Build 10 complete games from scratch',
      'Learn C# programming for game development',
      'Implement game physics and collision detection',
      'Create professional UI and menus',
      'Publish games to multiple platforms',
      'Understand game monetization strategies',
    ]

    for (let i = 0; i < objectives.length; i++) {
      await prisma.courseObjective.upsert({
        where: {
          courseId_objective: {
            courseId: course.id,
            objective: objectives[i],
          },
        },
        update: {},
        create: {
          objective: objectives[i],
          order: i + 1,
          courseId: course.id,
        },
      })
    }

    // Add course tags
    const tags = ['Unity', 'C#', 'Game Development', 'Beginner', 'Mobile Games']

    for (const tag of tags) {
      await prisma.courseTag.upsert({
        where: {
          courseId_tag: {
            courseId: course.id,
            tag: tag,
          },
        },
        update: {},
        create: {
          tag: tag,
          courseId: course.id,
        },
      })
    }

    // Add modules and lessons
    const module1 = await prisma.module.upsert({
      where: { id: 'mod-1' },
      update: {},
      create: {
        id: 'mod-1',
        title: 'Unity Fundamentals',
        description: 'Learn the Unity interface, scene hierarchy, and basic concepts',
        order: 1,
        duration: 480,
        courseId: course.id,
      },
    })

    // Add lessons to module 1
    const lessons = [
      {
        id: 'lesson-1',
        title: 'Introduction to Unity',
        description: 'Overview of Unity and its capabilities',
        type: 'VIDEO',
        order: 1,
        duration: 30,
        videoUrl: 'https://www.youtube.com/watch?v=XtQMytORBmM',
      },
      {
        id: 'lesson-2',
        title: 'Unity Interface Tour',
        description: 'Navigate the Unity editor like a pro',
        type: 'VIDEO',
        order: 2,
        duration: 45,
        videoUrl: 'https://www.youtube.com/watch?v=IlKaB1etrik',
      },
      {
        id: 'lesson-3',
        title: 'Creating Your First Scene',
        description: 'Hands-on scene creation and object placement',
        type: 'VIDEO',
        order: 3,
        duration: 60,
        videoUrl: 'https://www.youtube.com/watch?v=gB1F9G0JXOo',
      },
    ]

    for (const lesson of lessons) {
      await prisma.lesson.upsert({
        where: { id: lesson.id },
        update: {},
        create: {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          type: lesson.type as any,
          order: lesson.order,
          duration: lesson.duration,
          videoUrl: lesson.videoUrl,
          content: JSON.stringify({ isFree: lesson.order <= 2 }), // First 2 lessons are free
          moduleId: module1.id,
        },
      })
    }

    console.log('✅ Modules and lessons created')
    console.log('🎉 Course seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding course:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedCourse()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default seedCourse