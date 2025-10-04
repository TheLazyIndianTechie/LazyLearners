/**
 * Minimal Database Seed
 * For production or staging environments
 * Creates only essential data: admins, 1 instructor, 3 courses, minimal students
 */

import { PrismaClient, Role, Difficulty } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting minimal database seed...')

  // Hash password for all test users
  const hashedPassword = await bcrypt.hash('demo123', 10)

  // 1. Create single admin
  console.log('👤 Creating admin user...')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lazygamedevs.com' },
    update: {},
    create: {
      email: 'admin@lazygamedevs.com',
      name: 'Platform Admin',
      password: hashedPassword,
      role: 'ADMIN' as Role,
      bio: 'Platform administrator',
      location: 'Remote',
    },
  })
  console.log(`  ✓ Created admin: ${admin.name}`)

  // 2. Create single instructor
  console.log('👨‍🏫 Creating instructor...')
  const instructor = await prisma.user.upsert({
    where: { email: 'john.smith@instructor.com' },
    update: {},
    create: {
      email: 'john.smith@instructor.com',
      name: 'John Smith',
      password: hashedPassword,
      role: 'INSTRUCTOR' as Role,
      bio: 'Senior Unity developer with 12+ years of experience in game development',
      location: 'San Francisco, CA',
    },
  })
  console.log(`  ✓ Created instructor: ${instructor.name}`)

  // 3. Create 3 test students
  console.log('👥 Creating test students...')
  const studentData = [
    {
      email: 'student1@example.com',
      name: 'Alex Thompson',
      bio: 'Aspiring game developer',
      location: 'New York, NY',
    },
    {
      email: 'student2@example.com',
      name: 'Sarah Chen',
      bio: 'Learning game development',
      location: 'Toronto, Canada',
    },
    {
      email: 'student3@example.com',
      name: 'Mike Rodriguez',
      bio: 'Indie game enthusiast',
      location: 'Barcelona, Spain',
    },
  ]

  const students = []
  for (const data of studentData) {
    const student = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        ...data,
        password: hashedPassword,
        role: 'STUDENT' as Role,
      },
    })
    students.push(student)
    console.log(`  ✓ Created student: ${student.name}`)
  }

  // 4. Create 3 sample courses
  console.log('📚 Creating sample courses...')
  const courseData = [
    {
      title: 'Unity Fundamentals',
      description: 'Learn the basics of Unity game development',
      price: 49.99,
      category: 'UNITY_DEVELOPMENT',
      engine: 'UNITY',
      difficulty: 'BEGINNER' as Difficulty,
      duration: 1200,
    },
    {
      title: 'Unreal Engine Essentials',
      description: 'Introduction to Unreal Engine 5',
      price: 59.99,
      category: 'UNREAL_DEVELOPMENT',
      engine: 'UNREAL',
      difficulty: 'BEGINNER' as Difficulty,
      duration: 1500,
    },
    {
      title: 'Game Design Principles',
      description: 'Master the art of game design',
      price: 39.99,
      category: 'GAME_DESIGN',
      engine: 'AGNOSTIC',
      difficulty: 'BEGINNER' as Difficulty,
      duration: 900,
    },
  ]

  for (const data of courseData) {
    const course = await prisma.course.create({
      data: {
        ...data,
        instructorId: instructor.id,
        published: true,
        modules: {
          create: {
            title: 'Introduction',
            description: 'Getting started',
            order: 1,
            lessons: {
              create: [
                {
                  title: 'Welcome',
                  type: 'VIDEO',
                  order: 1,
                  duration: 300,
                  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                  content: 'Welcome to the course!',
                },
              ],
            },
          },
        },
      },
    })
    console.log(`  ✓ Created course: ${course.title}`)
  }

  console.log('')
  console.log('✅ Minimal seed completed successfully!')
  console.log('📊 Summary:')
  console.log('  👤 1 Admin')
  console.log('  👨‍🏫 1 Instructor')
  console.log('  👥 3 Students')
  console.log('  📚 3 Courses')
  console.log('')
  console.log('🔑 Login Credentials:')
  console.log('  Admin: admin@lazygamedevs.com / demo123')
  console.log('  Instructor: john.smith@instructor.com / demo123')
  console.log('  Student: student1@example.com / demo123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Minimal seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
