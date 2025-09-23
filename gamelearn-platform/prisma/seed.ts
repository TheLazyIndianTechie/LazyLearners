import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data (optional - remove in production)
  console.log('🧹 Cleaning existing data...')
  await prisma.quizAttempt.deleteMany()
  await prisma.progress.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.projectSubmission.deleteMany()
  await prisma.project.deleteMany()
  await prisma.portfolio.deleteMany()
  await prisma.reply.deleteMany()
  await prisma.forumPost.deleteMany()
  await prisma.review.deleteMany()
  await prisma.certification.deleteMany()
  await prisma.licenseKey.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.quiz.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.module.deleteMany()
  await prisma.course.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  // Create demo users
  const hashedPassword = await bcrypt.hash('demo123', 12)

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@lazygamedevs.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      bio: 'Platform administrator for LazyGameDevs',
    },
  })

  // Create multiple students
  const studentUser1 = await prisma.user.create({
    data: {
      email: 'student1@example.com',
      name: 'Alex Thompson',
      password: hashedPassword,
      role: 'STUDENT',
      bio: 'Aspiring indie game developer with a passion for 2D platformers',
      skills: '["Unity", "C#", "Pixel Art", "Game Design"]',
      location: 'San Francisco, CA',
    },
  })

  const studentUser2 = await prisma.user.create({
    data: {
      email: 'student2@example.com',
      name: 'Sarah Chen',
      password: hashedPassword,
      role: 'STUDENT',
      bio: 'Computer science student interested in VR development',
      skills: '["Unreal Engine", "C++", "VR", "3D Modeling"]',
      location: 'Toronto, Canada',
    },
  })

  const studentUser3 = await prisma.user.create({
    data: {
      email: 'student3@example.com',
      name: 'Mike Rodriguez',
      password: hashedPassword,
      role: 'STUDENT',
      bio: 'Mobile game developer focusing on casual games',
      skills: '["Unity", "Mobile Development", "UI/UX", "Monetization"]',
      location: 'Barcelona, Spain',
    },
  })

  // Create multiple instructors
  const instructorUnity = await prisma.user.create({
    data: {
      email: 'john.smith@instructor.com',
      name: 'John Smith',
      password: hashedPassword,
      role: 'INSTRUCTOR',
      bio: 'Senior Unity developer with 12+ years in the gaming industry. Former lead developer at EA and Ubisoft.',
      skills: '["Unity", "C#", "Game Architecture", "Performance Optimization", "Team Leadership"]',
      website: 'https://johnsmith.dev',
      location: 'Austin, TX',
    },
  })

  const instructorUnreal = await prisma.user.create({
    data: {
      email: 'emma.wilson@instructor.com',
      name: 'Emma Wilson',
      password: hashedPassword,
      role: 'INSTRUCTOR',
      bio: 'Unreal Engine expert and technical artist with AAA game development experience at Epic Games.',
      skills: '["Unreal Engine", "C++", "Blueprints", "Technical Art", "Shaders"]',
      website: 'https://emmawilson.dev',
      location: 'Seattle, WA',
    },
  })

  const instructorDesign = await prisma.user.create({
    data: {
      email: 'david.park@instructor.com',
      name: 'David Park',
      password: hashedPassword,
      role: 'INSTRUCTOR',
      bio: 'Game design consultant and indie developer with multiple successful mobile games.',
      skills: '["Game Design", "Level Design", "Monetization", "Analytics", "User Research"]',
      website: 'https://davidpark.games',
      location: 'Seoul, South Korea',
    },
  })

  const instructorGodot = await prisma.user.create({
    data: {
      email: 'lisa.anderson@instructor.com',
      name: 'Lisa Anderson',
      password: hashedPassword,
      role: 'INSTRUCTOR',
      bio: 'Open-source game development advocate and Godot Engine contributor.',
      skills: '["Godot", "GDScript", "Python", "Open Source", "Indie Development"]',
      website: 'https://lisaanderson.dev',
      location: 'Portland, OR',
    },
  })

  console.log('✅ Demo users created')

  // Create comprehensive courses
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
      instructorId: instructorUnity.id,
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

  // Create Unreal Engine course
  const unrealCourse = await prisma.course.create({
    data: {
      title: 'Unreal Engine 5 Masterclass',
      description: 'Master Unreal Engine 5 with Nanite, Lumen, and Blueprint development. Create stunning AAA-quality games.',
      thumbnail: '/api/placeholder/400/225',
      price: 129.99,
      published: true,
      category: 'UNREAL_DEVELOPMENT',
      engine: 'UNREAL',
      difficulty: 'INTERMEDIATE',
      duration: 3600, // 60 hours
      requirements: '["Basic programming knowledge", "Powerful PC/Mac", "16GB RAM recommended"]',
      objectives: '["Master UE5 features", "Create photorealistic environments", "Build complete games"]',
      tags: '["Unreal Engine", "UE5", "Blueprints", "C++", "Advanced"]',
      instructorId: instructorUnreal.id,
      modules: {
        create: [
          {
            title: 'Unreal Engine 5 Introduction',
            description: 'Getting started with UE5 and its revolutionary features',
            order: 1,
            duration: 720,
            lessons: {
              create: [
                {
                  title: 'UE5 Overview and Installation',
                  description: 'Complete guide to UE5 setup and features',
                  type: 'VIDEO',
                  content: '{"videoUrl": "/videos/ue5-intro.mp4"}',
                  order: 1,
                  duration: 45,
                  videoUrl: '/videos/ue5-intro.mp4',
                },
                {
                  title: 'Nanite and Lumen Explained',
                  description: 'Understanding UE5\'s game-changing technologies',
                  type: 'VIDEO',
                  content: '{"videoUrl": "/videos/nanite-lumen.mp4"}',
                  order: 2,
                  duration: 60,
                  videoUrl: '/videos/nanite-lumen.mp4',
                },
              ],
            },
          },
          {
            title: 'Blueprint Visual Scripting',
            description: 'Master Blueprint system for rapid game development',
            order: 2,
            duration: 900,
            lessons: {
              create: [
                {
                  title: 'Blueprint Fundamentals',
                  description: 'Core concepts of visual scripting in UE5',
                  type: 'VIDEO',
                  content: '{"videoUrl": "/videos/blueprint-basics.mp4"}',
                  order: 1,
                  duration: 75,
                  videoUrl: '/videos/blueprint-basics.mp4',
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

  // Create Game Design course
  const gameDesignCourse = await prisma.course.create({
    data: {
      title: 'Game Design Fundamentals',
      description: 'Learn the art and science of game design. Create engaging gameplay, balanced mechanics, and memorable experiences.',
      thumbnail: '/api/placeholder/400/225',
      price: 69.99,
      published: true,
      category: 'GAME_DESIGN',
      difficulty: 'BEGINNER',
      duration: 1800, // 30 hours
      requirements: '["Creative mindset", "Basic understanding of games"]',
      objectives: '["Understand game design principles", "Create game documents", "Design balanced gameplay"]',
      tags: '["Game Design", "Level Design", "UX", "Psychology", "Theory"]',
      instructorId: instructorDesign.id,
      modules: {
        create: [
          {
            title: 'Game Design Principles',
            description: 'Core principles that make games fun and engaging',
            order: 1,
            duration: 600,
            lessons: {
              create: [
                {
                  title: 'What Makes Games Fun?',
                  description: 'Psychology of game design and player motivation',
                  type: 'VIDEO',
                  content: '{"videoUrl": "/videos/game-psychology.mp4"}',
                  order: 1,
                  duration: 40,
                  videoUrl: '/videos/game-psychology.mp4',
                },
                {
                  title: 'Core Game Mechanics',
                  description: 'Building blocks of game systems',
                  type: 'VIDEO',
                  content: '{"videoUrl": "/videos/game-mechanics.mp4"}',
                  order: 2,
                  duration: 50,
                  videoUrl: '/videos/game-mechanics.mp4',
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

  // Create Godot course
  const godotCourse = await prisma.course.create({
    data: {
      title: 'Godot 4 Complete Course',
      description: 'Master the free and open-source Godot Engine. Learn GDScript, 2D/3D development, and publish your indie games.',
      thumbnail: '/api/placeholder/400/225',
      price: 49.99,
      published: true,
      category: 'GODOT_DEVELOPMENT',
      engine: 'GODOT',
      difficulty: 'BEGINNER',
      duration: 2000, // 33 hours
      requirements: '["Basic programming concepts", "Any computer"]',
      objectives: '["Master Godot 4", "Learn GDScript", "Build complete games", "Publish indie games"]',
      tags: '["Godot", "GDScript", "Open Source", "Indie", "2D", "3D"]',
      instructorId: instructorGodot.id,
      modules: {
        create: [
          {
            title: 'Godot 4 Fundamentals',
            description: 'Getting started with the Godot Engine',
            order: 1,
            duration: 500,
            lessons: {
              create: [
                {
                  title: 'Why Choose Godot?',
                  description: 'Advantages of the Godot Engine for indie developers',
                  type: 'VIDEO',
                  content: '{"videoUrl": "/videos/why-godot.mp4"}',
                  order: 1,
                  duration: 25,
                  videoUrl: '/videos/why-godot.mp4',
                },
                {
                  title: 'Godot Interface Tour',
                  description: 'Navigate the Godot editor efficiently',
                  type: 'VIDEO',
                  content: '{"videoUrl": "/videos/godot-interface.mp4"}',
                  order: 2,
                  duration: 35,
                  videoUrl: '/videos/godot-interface.mp4',
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

  // Create Mobile Game Development course
  const mobileCourse = await prisma.course.create({
    data: {
      title: 'Mobile Game Development with Unity',
      description: 'Build and monetize mobile games for iOS and Android. Learn optimization, monetization, and publishing strategies.',
      thumbnail: '/api/placeholder/400/225',
      price: 99.99,
      published: true,
      category: 'MOBILE_GAMES',
      engine: 'UNITY',
      difficulty: 'INTERMEDIATE',
      duration: 2800, // 47 hours
      requirements: '["Unity basics", "C# programming", "Mobile device for testing"]',
      objectives: '["Build mobile games", "Implement monetization", "Optimize performance", "Publish to stores"]',
      tags: '["Mobile", "Unity", "iOS", "Android", "Monetization", "Publishing"]',
      instructorId: instructorUnity.id,
      modules: {
        create: [
          {
            title: 'Mobile Game Optimization',
            description: 'Optimize games for mobile devices and various screen sizes',
            order: 1,
            duration: 700,
            lessons: {
              create: [
                {
                  title: 'Mobile Performance Basics',
                  description: 'Key considerations for mobile game performance',
                  type: 'VIDEO',
                  content: '{"videoUrl": "/videos/mobile-performance.mp4"}',
                  order: 1,
                  duration: 55,
                  videoUrl: '/videos/mobile-performance.mp4',
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

  console.log('✅ All courses created successfully')

  // Create enrollments for students
  const enrollments = await Promise.all([
    // Student 1 enrollments
    prisma.enrollment.create({
      data: {
        userId: studentUser1.id,
        courseId: unityCourse.id,
        status: 'ACTIVE',
      },
    }),
    prisma.enrollment.create({
      data: {
        userId: studentUser1.id,
        courseId: gameDesignCourse.id,
        status: 'ACTIVE',
      },
    }),
    // Student 2 enrollments
    prisma.enrollment.create({
      data: {
        userId: studentUser2.id,
        courseId: unrealCourse.id,
        status: 'ACTIVE',
      },
    }),
    // Student 3 enrollments
    prisma.enrollment.create({
      data: {
        userId: studentUser3.id,
        courseId: mobileCourse.id,
        status: 'ACTIVE',
      },
    }),
    prisma.enrollment.create({
      data: {
        userId: studentUser3.id,
        courseId: godotCourse.id,
        status: 'COMPLETED',
        completedAt: new Date('2024-08-15'),
      },
    }),
  ])

  // Create progress tracking
  await Promise.all([
    // Progress for Student 1 in Unity course
    prisma.progress.create({
      data: {
        userId: studentUser1.id,
        courseId: unityCourse.id,
        lessonId: unityCourse.modules[0].lessons[0].id,
        completionPercentage: 100,
        timeSpent: 30,
        completed: true,
      },
    }),
    prisma.progress.create({
      data: {
        userId: studentUser1.id,
        courseId: unityCourse.id,
        lessonId: unityCourse.modules[0].lessons[1].id,
        completionPercentage: 75,
        timeSpent: 35,
        completed: false,
      },
    }),
    // Progress for Student 2 in Unreal course
    prisma.progress.create({
      data: {
        userId: studentUser2.id,
        courseId: unrealCourse.id,
        lessonId: unrealCourse.modules[0].lessons[0].id,
        completionPercentage: 100,
        timeSpent: 45,
        completed: true,
      },
    }),
    // Progress for Student 3 in Mobile course
    prisma.progress.create({
      data: {
        userId: studentUser3.id,
        courseId: mobileCourse.id,
        lessonId: mobileCourse.modules[0].lessons[0].id,
        completionPercentage: 50,
        timeSpent: 25,
        completed: false,
      },
    }),
  ])

  console.log('✅ Enrollments and progress created')

  // Create course reviews
  await Promise.all([
    prisma.review.create({
      data: {
        rating: 5,
        comment: 'Excellent course! John explains Unity concepts clearly and the projects are fun to build.',
        userId: studentUser1.id,
        courseId: unityCourse.id,
      },
    }),
    prisma.review.create({
      data: {
        rating: 4,
        comment: 'Great course for beginners. Would love more advanced topics in the future.',
        userId: studentUser3.id,
        courseId: godotCourse.id,
      },
    }),
    prisma.review.create({
      data: {
        rating: 5,
        comment: 'Mind-blowing! UE5 is incredible and Emma makes it easy to understand.',
        userId: studentUser2.id,
        courseId: unrealCourse.id,
      },
    }),
    prisma.review.create({
      data: {
        rating: 4,
        comment: 'Solid foundation in game design principles. Really changed how I think about games.',
        userId: studentUser1.id,
        courseId: gameDesignCourse.id,
      },
    }),
  ])

  // Create portfolios for students
  const portfolio1 = await prisma.portfolio.create({
    data: {
      title: `${studentUser1.name}'s Portfolio`,
      description: 'Showcasing my journey from beginner to indie game developer',
      userId: studentUser1.id,
      projects: {
        create: [
          {
            title: 'Space Shooter Classic',
            description: 'A retro-style 2D space shooter with modern polish. Features power-ups, boss battles, and local high scores.',
            thumbnail: '/api/placeholder/300/200',
            engine: 'UNITY',
            webglBuild: '/games/space-shooter',
            sourceCode: 'https://github.com/alex-thompson/space-shooter',
            liveDemo: 'https://alex-games.itch.io/space-shooter',
            tags: '["Unity", "2D", "Space", "Shooter", "Retro"]',
            featured: true,
          },
          {
            title: 'Pixel Platformer',
            description: 'A challenging 2D platformer with hand-drawn pixel art and tight controls.',
            thumbnail: '/api/placeholder/300/200',
            engine: 'UNITY',
            webglBuild: '/games/pixel-platformer',
            sourceCode: 'https://github.com/alex-thompson/pixel-platformer',
            tags: '["Unity", "2D", "Platformer", "Pixel Art", "Indie"]',
          },
        ],
      },
    },
  })

  const portfolio2 = await prisma.portfolio.create({
    data: {
      title: `${studentUser2.name}'s Portfolio`,
      description: 'VR experiences and immersive game worlds',
      userId: studentUser2.id,
      projects: {
        create: [
          {
            title: 'VR Escape Room',
            description: 'An immersive VR puzzle experience with photorealistic environments.',
            thumbnail: '/api/placeholder/300/200',
            engine: 'UNREAL',
            sourceCode: 'https://github.com/sarah-chen/vr-escape',
            tags: '["Unreal Engine", "VR", "Puzzle", "Photorealistic"]',
            featured: true,
          },
        ],
      },
    },
  })

  // Create forum posts
  await Promise.all([
    prisma.forumPost.create({
      data: {
        title: 'Best practices for Unity performance optimization?',
        content: 'I\'m working on a mobile game and experiencing frame drops. What are your go-to optimization techniques?',
        category: 'Unity',
        tags: '["Unity", "Performance", "Mobile", "Optimization"]',
        authorId: studentUser1.id,
        likes: 12,
        views: 89,
        replies: {
          create: [
            {
              content: 'Object pooling is crucial for mobile! Also check your draw calls and batch static objects.',
              authorId: instructorUnity.id,
              likes: 8,
            },
            {
              content: 'Don\'t forget to optimize textures and use appropriate compression settings for mobile platforms.',
              authorId: studentUser3.id,
              likes: 3,
            },
          ],
        },
      },
    }),
    prisma.forumPost.create({
      data: {
        title: 'Godot vs Unity for 2D games?',
        content: 'I\'m starting a new 2D project and torn between Godot and Unity. What are the pros and cons?',
        category: 'General',
        tags: '["Godot", "Unity", "2D", "Comparison"]',
        authorId: studentUser2.id,
        likes: 24,
        views: 156,
        replies: {
          create: [
            {
              content: 'Godot is fantastic for 2D! Lighter weight, better 2D tools, and completely free. Unity has more resources though.',
              authorId: instructorGodot.id,
              likes: 15,
            },
          ],
        },
      },
    }),
  ])

  // Create sample payments and license keys
  const samplePayment1 = await prisma.payment.create({
    data: {
      dodoPaymentId: 'dodo_pay_sample_001',
      status: 'SUCCEEDED',
      amount: 8999, // $89.99
      currency: 'USD',
      paymentMethod: 'card',
      userId: studentUser1.id,
      courseId: unityCourse.id,
      completedAt: new Date('2024-09-01'),
      metadata: '{"payment_method": "visa", "last4": "4242"}',
    },
  })

  const samplePayment2 = await prisma.payment.create({
    data: {
      dodoPaymentId: 'dodo_pay_sample_002',
      status: 'SUCCEEDED',
      amount: 12999, // $129.99
      currency: 'USD',
      paymentMethod: 'card',
      userId: studentUser2.id,
      courseId: unrealCourse.id,
      completedAt: new Date('2024-09-10'),
      metadata: '{"payment_method": "mastercard", "last4": "5555"}',
    },
  })

  // Create license keys for successful payments
  await Promise.all([
    prisma.licenseKey.create({
      data: {
        key: 'UNITY-COURSE-2024-ABC123',
        status: 'ACTIVE',
        activationsLimit: 3,
        activationsCount: 1,
        expiresAt: new Date('2025-09-01'),
        userId: studentUser1.id,
        courseId: unityCourse.id,
        paymentId: samplePayment1.id,
      },
    }),
    prisma.licenseKey.create({
      data: {
        key: 'UNREAL-COURSE-2024-XYZ789',
        status: 'ACTIVE',
        activationsLimit: 5,
        activationsCount: 1,
        expiresAt: new Date('2025-09-10'),
        userId: studentUser2.id,
        courseId: unrealCourse.id,
        paymentId: samplePayment2.id,
      },
    }),
  ])

  // Create certifications for completed courses
  await prisma.certification.create({
    data: {
      name: 'Godot 4 Complete Course Certification',
      description: 'Successfully completed the comprehensive Godot 4 development course',
      issuer: 'LazyGameDevs',
      credentialId: 'LGDV-GODOT-2024-001',
      badgeUrl: '/badges/godot-completion.svg',
      verificationUrl: 'https://verify.lazygamedevs.com/LGDV-GODOT-2024-001',
      userId: studentUser3.id,
      issuedAt: new Date('2024-08-20'),
    },
  })

  console.log('✅ Reviews, portfolios, forum posts, payments, and certifications created')

  console.log('🎉 Database seeding completed successfully!')
  console.log('')
  console.log('📊 Sample Data Summary:')
  console.log('👥 Users: 1 Admin, 4 Instructors, 3 Students')
  console.log('📚 Courses: 5 complete courses with modules and lessons')
  console.log('📝 Enrollments: Multiple active and completed enrollments')
  console.log('💳 Payments: 2 successful payments with license keys')
  console.log('🏆 Certifications: 1 completion certificate')
  console.log('💬 Forum: 2 posts with replies and engagement')
  console.log('🎨 Portfolios: 2 portfolios with showcase projects')
  console.log('')
  console.log('🔑 Login Credentials:')
  console.log('Admin: admin@lazygamedevs.com / demo123')
  console.log('Student: student1@example.com / demo123')
  console.log('Instructor: john.smith@instructor.com / demo123')
  console.log('')
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