/**
 * Database Reset Script
 * Clears all data from the database while preserving schema
 * Use with caution - this will delete ALL data!
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Starting database reset...')
  console.log('⚠️  This will DELETE ALL DATA from the database!')

  // Add confirmation check for production
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Cannot reset production database!')
    console.error('   Set NODE_ENV to something other than "production" to proceed.')
    process.exit(1)
  }

  try {
    // Delete in reverse dependency order to avoid foreign key constraints
    console.log('📝 Deleting reviews...')
    await prisma.review.deleteMany({})

    console.log('📊 Deleting quiz attempts...')
    await prisma.quizAttempt.deleteMany({})

    console.log('📖 Deleting lesson progress...')
    await prisma.lessonProgress.deleteMany({})

    console.log('🎯 Deleting course progress...')
    await prisma.courseProgress.deleteMany({})

    console.log('🎓 Deleting enrollments...')
    await prisma.enrollment.deleteMany({})

    console.log('🔑 Deleting license keys...')
    await prisma.licenseKey.deleteMany({})

    console.log('💳 Deleting payments...')
    await prisma.payment.deleteMany({})

    console.log('🏆 Deleting certifications...')
    await prisma.certification.deleteMany({})

    console.log('📁 Deleting resources...')
    await prisma.resource.deleteMany({})

    console.log('📖 Deleting lessons...')
    await prisma.lesson.deleteMany({})

    console.log('📚 Deleting modules...')
    await prisma.module.deleteMany({})

    console.log('📕 Deleting courses...')
    await prisma.course.deleteMany({})

    console.log('💬 Deleting forum replies...')
    await prisma.forumReply.deleteMany({})

    console.log('💭 Deleting forum posts...')
    await prisma.forumPost.deleteMany({})

    console.log('🎨 Deleting portfolio projects...')
    await prisma.portfolioProject.deleteMany({})

    console.log('👤 Deleting user skills...')
    await prisma.userSkill.deleteMany({})

    console.log('🔐 Deleting OAuth accounts...')
    await prisma.oAuthAccount.deleteMany({})

    console.log('👥 Deleting users...')
    await prisma.user.deleteMany({})

    console.log('')
    console.log('✅ Database reset completed successfully!')
    console.log('💡 Run seed script to populate with fresh data:')
    console.log('   npm run db:seed              # Full seed')
    console.log('   npm run db:seed:minimal      # Minimal seed')
  } catch (error) {
    console.error('❌ Database reset failed:', error)
    throw error
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
