import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create demo users
  const hashedPassword = await bcrypt.hash('demo123', 12)

  const studentUser = await prisma.user.upsert({
    where: { email: 'demo@student.com' },
    update: {},
    create: {
      email: 'demo@student.com',
      name: 'Demo Student',
      password: hashedPassword,
      role: 'STUDENT',
      bio: 'Aspiring game developer learning Unity and C#',
    },
  })

  const instructorUser = await prisma.user.upsert({
    where: { email: 'demo@instructor.com' },
    update: {},
    create: {
      email: 'demo@instructor.com',
      name: 'Demo Instructor',
      password: hashedPassword,
      role: 'INSTRUCTOR',
      bio: 'Senior Unity developer with 10+ years of experience in the gaming industry',
    },
  })

  console.log('✅ Demo users created:', { studentUser, instructorUser })

  // Create demo courses
  const unityCourse = await prisma.course.create({
    data: {
      title: 'Complete Unity Game Development Course',
      description: 'Learn Unity from scratch and build 10 complete games. Master C# programming, game physics, UI design, and publishing to multiple platforms.',
      thumbnail: '/api/placeholder/400/225',
      price: 89.99,
      published: true,
      category: 'UNITY_DEVELOPMENT',
      engine: 'UNITY',
      difficulty: 'BEGINNER',
      duration: 2400, // 40 hours
      requirements: '["Basic computer skills", "Windows or Mac computer"]',
      objectives: '["Master Unity interface", "Build complete games", "Publish to app stores"]',
      tags: '["Unity", "C#", "Game Development", "Beginner"]',
      instructorId: instructorUser.id,
      modules: {
        create: [
          {
            title: 'Unity Fundamentals',
            description: 'Learn the Unity interface, scene hierarchy, and basic concepts',
            order: 1,
            duration: 480,
            lessons: {
              create: [
                {
                  title: 'Introduction to Unity',
                  description: 'Overview of Unity and its capabilities',
                  type: 'VIDEO',
                  content: '{"videoUrl": "/videos/unity-intro.mp4"}',
                  order: 1,
                  duration: 30,
                  videoUrl: '/videos/unity-intro.mp4',
                },
                {
                  title: 'Unity Interface Tour',
                  description: 'Navigate the Unity editor like a pro',
                  type: 'VIDEO',
                  content: '{"videoUrl": "/videos/unity-interface.mp4"}',
                  order: 2,
                  duration: 45,
                  videoUrl: '/videos/unity-interface.mp4',
                },
              ],
            },
          },
          {
            title: 'C# Programming Basics',
            description: 'Learn C# programming fundamentals for game development',
            order: 2,
            duration: 600,
            lessons: {
              create: [
                {
                  title: 'Variables and Data Types',
                  description: 'Understanding C# basics for Unity',
                  type: 'VIDEO',
                  content: '{"videoUrl": "/videos/csharp-basics.mp4"}',
                  order: 1,
                  duration: 60,
                  videoUrl: '/videos/csharp-basics.mp4',
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      modules: {
        include: {
          lessons: true,
        },
      },
    },
  })

  // Create demo enrollment
  await prisma.enrollment.create({
    data: {
      userId: studentUser.id,
      courseId: unityCourse.id,
      status: 'ACTIVE',
    },
  })

  // Create demo progress
  await prisma.progress.create({
    data: {
      userId: studentUser.id,
      courseId: unityCourse.id,
      lessonId: unityCourse.modules[0].lessons[0].id,
      completionPercentage: 100,
      timeSpent: 30,
      completed: true,
    },
  })

  await prisma.progress.create({
    data: {
      userId: studentUser.id,
      courseId: unityCourse.id,
      lessonId: unityCourse.modules[0].lessons[1].id,
      completionPercentage: 50,
      timeSpent: 20,
      completed: false,
    },
  })

  console.log('✅ Demo course and enrollments created')

  // Create demo portfolio
  const portfolio = await prisma.portfolio.create({
    data: {
      title: `${studentUser.name}'s Portfolio`,
      description: 'Showcasing my game development journey',
      userId: studentUser.id,
      projects: {
        create: [
          {
            title: 'Space Shooter Game',
            description: 'A classic 2D space shooter built with Unity',
            thumbnail: '/api/placeholder/300/200',
            engine: 'UNITY',
            webglBuild: '/games/space-shooter',
            sourceCode: 'https://github.com/demo/space-shooter',
            tags: '["Unity", "2D", "Space", "Shooter"]',
          },
          {
            title: 'Platformer Adventure',
            description: 'A 2D platformer with custom physics and animations',
            thumbnail: '/api/placeholder/300/200',
            engine: 'UNITY',
            webglBuild: '/games/platformer',
            tags: '["Unity", "2D", "Platformer", "Physics"]',
          },
        ],
      },
    },
  })

  console.log('✅ Demo portfolio created')

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })