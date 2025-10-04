/**
 * Database Validation Script
 * Validates seed data integrity and relationships
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ValidationResult {
  passed: number
  failed: number
  warnings: string[]
  errors: string[]
}

async function main() {
  console.log('🔍 Starting database validation...')
  console.log('')

  const result: ValidationResult = {
    passed: 0,
    failed: 0,
    warnings: [],
    errors: [],
  }

  // 1. Validate user counts and roles
  console.log('👥 Validating users...')
  const userCounts = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  })

  const adminCount = userCounts.find((u) => u.role === 'ADMIN')?._count || 0
  const instructorCount = userCounts.find((u) => u.role === 'INSTRUCTOR')?._count || 0
  const studentCount = userCounts.find((u) => u.role === 'STUDENT')?._count || 0

  console.log(`  Admins: ${adminCount}`)
  console.log(`  Instructors: ${instructorCount}`)
  console.log(`  Students: ${studentCount}`)

  if (adminCount === 0) {
    result.errors.push('No admin users found')
    result.failed++
  } else {
    result.passed++
  }

  if (instructorCount === 0) {
    result.warnings.push('No instructors found')
  } else {
    result.passed++
  }

  if (studentCount === 0) {
    result.warnings.push('No students found')
  } else {
    result.passed++
  }

  // 2. Validate courses
  console.log('')
  console.log('📚 Validating courses...')
  const courseCount = await prisma.course.count()
  const publishedCourses = await prisma.course.count({ where: { published: true } })
  const coursesWithModules = await prisma.course.count({
    where: { modules: { some: {} } },
  })

  console.log(`  Total courses: ${courseCount}`)
  console.log(`  Published: ${publishedCourses}`)
  console.log(`  With modules: ${coursesWithModules}`)

  if (courseCount === 0) {
    result.errors.push('No courses found')
    result.failed++
  } else {
    result.passed++
  }

  if (coursesWithModules < courseCount) {
    result.warnings.push(`${courseCount - coursesWithModules} courses have no modules`)
  }

  // 3. Validate course structure (modules and lessons)
  console.log('')
  console.log('📖 Validating course structure...')
  const moduleCount = await prisma.module.count()
  const lessonCount = await prisma.lesson.count()

  console.log(`  Modules: ${moduleCount}`)
  console.log(`  Lessons: ${lessonCount}`)

  if (courseCount > 0 && moduleCount === 0) {
    result.errors.push('Courses exist but no modules found')
    result.failed++
  } else if (moduleCount > 0) {
    result.passed++
  }

  if (moduleCount > 0 && lessonCount === 0) {
    result.errors.push('Modules exist but no lessons found')
    result.failed++
  } else if (lessonCount > 0) {
    result.passed++
  }

  // 4. Validate enrollments and relationships
  console.log('')
  console.log('🎓 Validating enrollments...')
  const enrollmentCount = await prisma.enrollment.count()
  const progressCount = await prisma.progress.count()

  console.log(`  Total enrollments: ${enrollmentCount}`)
  console.log(`  Progress records: ${progressCount}`)

  if (enrollmentCount > 0) {
    result.passed++

    // All enrollments should have valid user and course references
    const validEnrollments = await prisma.enrollment.findMany({
      where: {
        AND: [
          { userId: { not: '' } },
          { courseId: { not: '' } }
        ]
      }
    })

    if (validEnrollments.length === enrollmentCount) {
      result.passed++
    } else {
      result.errors.push(`${enrollmentCount - validEnrollments.length} enrollments have invalid references`)
      result.failed++
    }
  }

  // 5. Validate payments and license keys
  console.log('')
  console.log('💳 Validating payments...')
  const paymentCount = await prisma.payment.count()
  const successfulPayments = await prisma.payment.count({ where: { status: 'SUCCEEDED' } })
  const licenseKeyCount = await prisma.licenseKey.count()

  console.log(`  Total payments: ${paymentCount}`)
  console.log(`  Successful: ${successfulPayments}`)
  console.log(`  License keys: ${licenseKeyCount}`)

  if (paymentCount > 0) {
    result.passed++
  }

  // Each successful payment should have a license key
  if (successfulPayments > licenseKeyCount) {
    result.warnings.push(
      `${successfulPayments - licenseKeyCount} successful payments missing license keys`
    )
  }

  // 6. Validate data integrity
  console.log('')
  console.log('🔐 Validating data integrity...')

  // Check for courses with valid instructors
  if (courseCount > 0) {
    const coursesWithInstructor = await prisma.course.findMany({
      where: {
        instructorId: { not: '' }
      }
    })

    if (coursesWithInstructor.length === courseCount) {
      result.passed++
    } else {
      result.errors.push(`${courseCount - coursesWithInstructor.length} courses have no instructor`)
      result.failed++
    }
  }

  // Check for lessons with valid modules
  if (lessonCount > 0) {
    const lessonsWithModule = await prisma.lesson.findMany({
      where: {
        moduleId: { not: '' }
      }
    })

    if (lessonsWithModule.length === lessonCount) {
      result.passed++
    } else {
      result.errors.push(`${lessonCount - lessonsWithModule.length} lessons are not assigned to any module`)
      result.failed++
    }
  }

  // 7. Print summary
  console.log('')
  console.log('=' .repeat(60))
  console.log('📊 VALIDATION SUMMARY')
  console.log('=' .repeat(60))
  console.log(`✅ Passed: ${result.passed}`)
  console.log(`❌ Failed: ${result.failed}`)
  console.log(`⚠️  Warnings: ${result.warnings.length}`)
  console.log('')

  if (result.errors.length > 0) {
    console.log('❌ ERRORS:')
    result.errors.forEach((err) => console.log(`   - ${err}`))
    console.log('')
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS:')
    result.warnings.forEach((warn) => console.log(`   - ${warn}`))
    console.log('')
  }

  if (result.failed === 0 && result.errors.length === 0) {
    console.log('✅ Database validation passed!')
    console.log('   All required data is present and relationships are valid.')
  } else {
    console.log('❌ Database validation failed!')
    console.log('   Please review errors above and re-seed if necessary.')
    process.exit(1)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Validation script error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
