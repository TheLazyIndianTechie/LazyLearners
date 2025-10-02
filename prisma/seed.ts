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

  // User data templates for comprehensive generation
  const hashedPassword = await bcrypt.hash('demo123', 12)

  // Admin user templates
  const adminTemplates = [
    {
      email: 'admin@lazygamedevs.com',
      name: 'Admin User',
      bio: 'Platform administrator for LazyGameDevs',
      location: 'Remote'
    },
    {
      email: 'superadmin@lazygamedevs.com',
      name: 'Super Admin',
      bio: 'Senior platform administrator with full system access',
      location: 'San Francisco, CA'
    },
    {
      email: 'support@lazygamedevs.com',
      name: 'Support Admin',
      bio: 'Customer support and user management administrator',
      location: 'Austin, TX'
    }
  ]

  // Instructor templates with game engine expertise
  const instructorTemplates = [
    {
      email: 'john.smith@instructor.com',
      name: 'John Smith',
      bio: 'Senior Unity developer with 12+ years in the gaming industry. Former lead developer at EA and Ubisoft.',
      website: 'https://johnsmith.dev',
      location: 'Austin, TX',
      skills: ['Unity', 'C#', 'Game Architecture', 'Performance Optimization', 'Team Leadership'],
      expertise: 'UNITY_DEVELOPMENT'
    },
    {
      email: 'emma.wilson@instructor.com',
      name: 'Emma Wilson',
      bio: 'Unreal Engine expert and technical artist with AAA game development experience at Epic Games.',
      website: 'https://emmawilson.dev',
      location: 'Seattle, WA',
      skills: ['Unreal Engine', 'C++', 'Blueprints', 'Technical Art', 'Shaders'],
      expertise: 'UNREAL_DEVELOPMENT'
    },
    {
      email: 'david.park@instructor.com',
      name: 'David Park',
      bio: 'Game design consultant and indie developer with multiple successful mobile games.',
      website: 'https://davidpark.games',
      location: 'Seoul, South Korea',
      skills: ['Game Design', 'Level Design', 'Monetization', 'Analytics', 'User Research'],
      expertise: 'GAME_DESIGN'
    },
    {
      email: 'lisa.anderson@instructor.com',
      name: 'Lisa Anderson',
      bio: 'Open-source game development advocate and Godot Engine contributor.',
      website: 'https://lisaanderson.dev',
      location: 'Portland, OR',
      skills: ['Godot', 'GDScript', 'Python', 'Open Source', 'Indie Development'],
      expertise: 'GODOT_DEVELOPMENT'
    },
    {
      email: 'carlos.rodriguez@instructor.com',
      name: 'Carlos Rodriguez',
      bio: 'C++ programming expert and game engine architect with 15 years of experience.',
      website: 'https://carlosrod.dev',
      location: 'Madrid, Spain',
      skills: ['C++', 'Game Engines', 'Low-Level Programming', 'Memory Management', 'Multithreading'],
      expertise: 'GAME_PROGRAMMING'
    },
    {
      email: 'maria.santos@instructor.com',
      name: 'Maria Santos',
      bio: 'Mobile game development specialist with expertise in iOS and Android platforms.',
      website: 'https://mariasantos.games',
      location: 'São Paulo, Brazil',
      skills: ['Mobile Development', 'Unity', 'Swift', 'Kotlin', 'App Store Optimization'],
      expertise: 'MOBILE_GAMES'
    },
    {
      email: 'zhang.wei@instructor.com',
      name: 'Zhang Wei',
      bio: '3D artist and character designer for AAA games. Former Blizzard and Riot Games artist.',
      website: 'https://zhangwei.art',
      location: 'Shanghai, China',
      skills: ['3D Modeling', 'Character Design', 'Blender', 'ZBrush', 'Substance Painter'],
      expertise: 'GAME_ART'
    },
    {
      email: 'alex.petrov@instructor.com',
      name: 'Alex Petrov',
      bio: 'VR/AR developer with expertise in Unity XR and Unreal VR development.',
      website: 'https://alexpetrov.vr',
      location: 'Moscow, Russia',
      skills: ['VR Development', 'AR Development', 'Unity XR', 'Meta Quest', 'Spatial Audio'],
      expertise: 'VR_AR_DEVELOPMENT'
    },
    {
      email: 'sarah.mitchell@instructor.com',
      name: 'Sarah Mitchell',
      bio: 'Game audio designer and composer with credits on 50+ indie and AAA titles.',
      website: 'https://sarahmitchell.audio',
      location: 'Los Angeles, CA',
      skills: ['Sound Design', 'Music Composition', 'FMOD', 'Wwise', 'Audio Programming'],
      expertise: 'GAME_AUDIO'
    },
    {
      email: 'james.taylor@instructor.com',
      name: 'James Taylor',
      bio: 'Indie game developer and publisher. Successfully launched 10+ games on Steam.',
      website: 'https://jamestaylor.games',
      location: 'London, UK',
      skills: ['Indie Development', 'Steam Publishing', 'Marketing', 'Community Building', 'Game Jams'],
      expertise: 'INDIE_DEVELOPMENT'
    },
    {
      email: 'yuki.tanaka@instructor.com',
      name: 'Yuki Tanaka',
      bio: 'Network programming specialist focusing on multiplayer game architecture.',
      website: 'https://yukitanaka.net',
      location: 'Tokyo, Japan',
      skills: ['Network Programming', 'Multiplayer Systems', 'Server Architecture', 'Netcode', 'Lag Compensation'],
      expertise: 'GAME_PROGRAMMING'
    },
    {
      email: 'nina.kowalski@instructor.com',
      name: 'Nina Kowalski',
      bio: 'Technical animator and rigging specialist for game characters.',
      website: 'https://ninakowalski.tech',
      location: 'Warsaw, Poland',
      skills: ['Technical Animation', 'Character Rigging', 'Motion Capture', 'Animation Systems', 'Inverse Kinematics'],
      expertise: 'GAME_ART'
    }
  ]

  // Student templates with varied interests and skill levels
  const studentTemplates = [
    {
      email: 'alex.thompson@student.com',
      name: 'Alex Thompson',
      bio: 'Aspiring indie game developer with a passion for 2D platformers',
      location: 'San Francisco, CA',
      skills: ['Unity', 'C#', 'Pixel Art', 'Game Design'],
      interests: ['UNITY_DEVELOPMENT', 'GAME_DESIGN', 'INDIE_DEVELOPMENT']
    },
    {
      email: 'sarah.chen@student.com',
      name: 'Sarah Chen',
      bio: 'Computer science student interested in VR development and immersive experiences',
      location: 'Toronto, Canada',
      skills: ['Unreal Engine', 'C++', 'VR', '3D Modeling'],
      interests: ['VR_AR_DEVELOPMENT', 'UNREAL_DEVELOPMENT']
    },
    {
      email: 'mike.rodriguez@student.com',
      name: 'Mike Rodriguez',
      bio: 'Mobile game developer focusing on casual games and F2P mechanics',
      location: 'Barcelona, Spain',
      skills: ['Unity', 'Mobile Development', 'UI/UX', 'Monetization'],
      interests: ['MOBILE_GAMES', 'GAME_DESIGN']
    },
    {
      email: 'emily.johnson@student.com',
      name: 'Emily Johnson',
      bio: 'Art student learning game art and character design',
      location: 'New York, NY',
      skills: ['Blender', '2D Art', 'Character Design', 'Adobe Creative Suite'],
      interests: ['GAME_ART']
    },
    {
      email: 'ryan.kim@student.com',
      name: 'Ryan Kim',
      bio: 'High school student passionate about making games with Godot',
      location: 'Seoul, South Korea',
      skills: ['Godot', 'GDScript', 'Pixel Art'],
      interests: ['GODOT_DEVELOPMENT', 'INDIE_DEVELOPMENT']
    },
    {
      email: 'jessica.brown@student.com',
      name: 'Jessica Brown',
      bio: 'Audio engineering student exploring game sound design',
      location: 'Nashville, TN',
      skills: ['Sound Design', 'Music Production', 'Audio Editing'],
      interests: ['GAME_AUDIO']
    },
    {
      email: 'david.lee@student.com',
      name: 'David Lee',
      bio: 'Programmer learning C++ and game engine development',
      location: 'Singapore',
      skills: ['C++', 'Data Structures', 'Algorithms', 'Mathematics'],
      interests: ['GAME_PROGRAMMING']
    },
    {
      email: 'olivia.martinez@student.com',
      name: 'Olivia Martinez',
      bio: 'Game design student focusing on narrative and storytelling',
      location: 'Mexico City, Mexico',
      skills: ['Writing', 'Game Design', 'Unity', 'Dialogue Systems'],
      interests: ['GAME_DESIGN']
    },
    {
      email: 'liam.wilson@student.com',
      name: 'Liam Wilson',
      bio: 'Amateur developer working on first multiplayer game',
      location: 'Sydney, Australia',
      skills: ['Unity', 'Networking', 'C#', 'Database'],
      interests: ['GAME_PROGRAMMING', 'UNITY_DEVELOPMENT']
    },
    {
      email: 'sophia.anderson@student.com',
      name: 'Sophia Anderson',
      bio: 'Environmental artist learning to create stunning game worlds',
      location: 'Vancouver, Canada',
      skills: ['Unreal Engine', '3D Modeling', 'Level Design', 'Lighting'],
      interests: ['GAME_ART', 'UNREAL_DEVELOPMENT']
    },
    {
      email: 'noah.taylor@student.com',
      name: 'Noah Taylor',
      bio: 'VR enthusiast building immersive educational experiences',
      location: 'Berlin, Germany',
      skills: ['Unity', 'VR', 'C#', 'User Testing'],
      interests: ['VR_AR_DEVELOPMENT']
    },
    {
      email: 'emma.white@student.com',
      name: 'Emma White',
      bio: 'Indie developer preparing for first Steam launch',
      location: 'Brighton, UK',
      skills: ['Unity', 'Marketing', 'Community Management', 'Pixel Art'],
      interests: ['INDIE_DEVELOPMENT', 'GAME_DESIGN']
    },
    {
      email: 'ethan.garcia@student.com',
      name: 'Ethan Garcia',
      bio: 'Mobile AR developer creating location-based games',
      location: 'Miami, FL',
      skills: ['Unity', 'AR', 'GPS Integration', 'Mobile Development'],
      interests: ['MOBILE_GAMES', 'VR_AR_DEVELOPMENT']
    },
    {
      email: 'ava.martinez@student.com',
      name: 'Ava Martinez',
      bio: 'Animation student transitioning to game animation',
      location: 'Los Angeles, CA',
      skills: ['Animation', 'Maya', 'Rigging', 'Motion Capture'],
      interests: ['GAME_ART']
    },
    {
      email: 'mason.davis@student.com',
      name: 'Mason Davis',
      bio: 'Physics student interested in realistic game simulations',
      location: 'Boston, MA',
      skills: ['Mathematics', 'Physics', 'C++', 'Algorithm Design'],
      interests: ['GAME_PROGRAMMING']
    },
    {
      email: 'isabella.moore@student.com',
      name: 'Isabella Moore',
      bio: 'Aspiring sound designer for horror games',
      location: 'Portland, OR',
      skills: ['Sound Design', 'Audio Editing', 'FMOD', 'Horror Game Design'],
      interests: ['GAME_AUDIO', 'GAME_DESIGN']
    },
    {
      email: 'lucas.hernandez@student.com',
      name: 'Lucas Hernandez',
      bio: 'Unreal Engine beginner learning Blueprint visual scripting',
      location: 'Buenos Aires, Argentina',
      skills: ['Unreal Engine', 'Blueprints', '3D Art Basics'],
      interests: ['UNREAL_DEVELOPMENT']
    },
    {
      email: 'mia.clark@student.com',
      name: 'Mia Clark',
      bio: 'Game writer and narrative designer',
      location: 'Edinburgh, Scotland',
      skills: ['Creative Writing', 'Story Design', 'Character Development', 'Dialogue'],
      interests: ['GAME_DESIGN']
    },
    {
      email: 'logan.lewis@student.com',
      name: 'Logan Lewis',
      bio: 'Godot enthusiast contributing to open-source game projects',
      location: 'Amsterdam, Netherlands',
      skills: ['Godot', 'GDScript', 'Git', 'Open Source Collaboration'],
      interests: ['GODOT_DEVELOPMENT', 'INDIE_DEVELOPMENT']
    },
    {
      email: 'charlotte.walker@student.com',
      name: 'Charlotte Walker',
      bio: 'Mobile game designer studying player retention strategies',
      location: 'Helsinki, Finland',
      skills: ['Mobile Game Design', 'Analytics', 'User Acquisition', 'A/B Testing'],
      interests: ['MOBILE_GAMES', 'GAME_DESIGN']
    },
    {
      email: 'jackson.hall@student.com',
      name: 'Jackson Hall',
      bio: 'Shader programmer creating visual effects for games',
      location: 'Copenhagen, Denmark',
      skills: ['Shader Programming', 'HLSL', 'Unity', 'Mathematics'],
      interests: ['GAME_PROGRAMMING', 'GAME_ART']
    },
    {
      email: 'amelia.allen@student.com',
      name: 'Amelia Allen',
      bio: 'Texture artist specializing in PBR materials',
      location: 'Stockholm, Sweden',
      skills: ['Substance Painter', 'PBR Texturing', 'Photoshop', '3D Modeling'],
      interests: ['GAME_ART']
    },
    {
      email: 'benjamin.young@student.com',
      name: 'Benjamin Young',
      bio: 'Competitive game designer studying multiplayer balance',
      location: 'Vienna, Austria',
      skills: ['Game Design', 'Balancing', 'Systems Design', 'Analytics'],
      interests: ['GAME_DESIGN', 'GAME_PROGRAMMING']
    }
  ]

  // Generate admin users
  console.log('👥 Creating admin users...')
  const adminUsers = []
  for (const template of adminTemplates) {
    const admin = await prisma.user.create({
      data: {
        ...template,
        password: hashedPassword,
        role: 'ADMIN',
      },
    })
    adminUsers.push(admin)
    console.log(`  ✓ Created admin: ${admin.name}`)
  }

  // Generate instructor users
  console.log('\n📚 Creating instructor accounts...')
  const instructors: any[] = []
  for (const template of instructorTemplates) {
    const { skills, expertise, ...userData } = template
    const instructor = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        role: 'INSTRUCTOR',
        skills: {
          create: skills.map((skill: string) => ({ skill }))
        }
      },
    })
    instructors.push({ ...instructor, expertise })
    console.log(`  ✓ Created instructor: ${instructor.name} (${expertise})`)
  }

  // Generate student users
  console.log('\n🎓 Creating student accounts...')
  const students: any[] = []
  for (const template of studentTemplates) {
    const { skills, interests, ...userData } = template
    const student = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        role: 'STUDENT',
        skills: {
          create: skills.map((skill: string) => ({ skill }))
        }
      },
    })
    students.push({ ...student, interests })
    console.log(`  ✓ Created student: ${student.name}`)
  }

  console.log(`\n✅ Created ${adminUsers.length} admins, ${instructors.length} instructors, ${students.length} students`)

  // Keep references for backward compatibility
  const adminUser = adminUsers[0]
  const instructorUnity = instructors.find(i => i.expertise === 'UNITY_DEVELOPMENT') || instructors[0]
  const instructorUnreal = instructors.find(i => i.expertise === 'UNREAL_DEVELOPMENT') || instructors[1]
  const instructorDesign = instructors.find(i => i.expertise === 'GAME_DESIGN') || instructors[2]
  const instructorGodot = instructors.find(i => i.expertise === 'GODOT_DEVELOPMENT') || instructors[3]
  const studentUser1 = students[0]
  const studentUser2 = students[1]
  const studentUser3 = students[2]

  // Create OAuth Account records for testing authentication flows
  console.log('\n🔐 Creating OAuth Account records for testing...')

  // Create Google OAuth accounts for students (first 5 students)
  const googleStudentAccounts = []
  for (let i = 0; i < Math.min(5, students.length); i++) {
    const student = students[i]
    const account = await prisma.account.create({
      data: {
        userId: student.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: `google_${student.id}`,
        access_token: `mock_google_access_token_${student.id}`,
        refresh_token: `mock_google_refresh_token_${student.id}`,
        token_type: 'Bearer',
        scope: 'openid profile email',
        expires_at: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
      }
    })
    googleStudentAccounts.push(account)
    console.log(`  ✓ Created Google OAuth for: ${student.name}`)
  }

  // Create GitHub OAuth accounts for instructors (first 5 instructors)
  const githubInstructorAccounts = []
  for (let i = 0; i < Math.min(5, instructors.length); i++) {
    const instructor = instructors[i]
    const account = await prisma.account.create({
      data: {
        userId: instructor.id,
        type: 'oauth',
        provider: 'github',
        providerAccountId: `github_${instructor.id}`,
        access_token: `mock_github_access_token_${instructor.id}`,
        refresh_token: `mock_github_refresh_token_${instructor.id}`,
        token_type: 'Bearer',
        scope: 'read:user user:email',
        expires_at: Math.floor(Date.now() / 1000) + 7200, // Expires in 2 hours
      }
    })
    githubInstructorAccounts.push(account)
    console.log(`  ✓ Created GitHub OAuth for: ${instructor.name}`)
  }

  // Create mixed OAuth accounts (Google for some instructors, GitHub for some students)
  const mixedAccounts = []

  // Add Google OAuth for 3 more instructors
  for (let i = 5; i < Math.min(8, instructors.length); i++) {
    const instructor = instructors[i]
    const account = await prisma.account.create({
      data: {
        userId: instructor.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: `google_${instructor.id}`,
        access_token: `mock_google_access_token_${instructor.id}`,
        token_type: 'Bearer',
        scope: 'openid profile email',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
    })
    mixedAccounts.push(account)
    console.log(`  ✓ Created Google OAuth for: ${instructor.name}`)
  }

  // Add GitHub OAuth for 3 more students
  for (let i = 5; i < Math.min(8, students.length); i++) {
    const student = students[i]
    const account = await prisma.account.create({
      data: {
        userId: student.id,
        type: 'oauth',
        provider: 'github',
        providerAccountId: `github_${student.id}`,
        access_token: `mock_github_access_token_${student.id}`,
        token_type: 'Bearer',
        scope: 'read:user user:email',
        expires_at: Math.floor(Date.now() / 1000) + 7200,
      }
    })
    mixedAccounts.push(account)
    console.log(`  ✓ Created GitHub OAuth for: ${student.name}`)
  }

  const totalOAuthAccounts = googleStudentAccounts.length + githubInstructorAccounts.length + mixedAccounts.length
  const totalGoogle = googleStudentAccounts.length + 3 // 3 more instructors with Google from mixed
  const totalGithub = githubInstructorAccounts.length + 3 // 3 more students with GitHub from mixed
  console.log(`✅ Created ${totalOAuthAccounts} OAuth Account records (Google: ${totalGoogle}, GitHub: ${totalGithub})`)

  // Course template data for comprehensive generation
  const courseTemplates = {
    GAME_PROGRAMMING: [
      {
        title: 'Complete C++ Game Programming',
        description: 'Master C++ for game development with practical projects. Learn memory management, OOP, and game engine architecture.',
        price: 99.99,
        difficulty: 'INTERMEDIATE',
        duration: 3200,
        requirements: ['Basic programming knowledge', 'C++ compiler installed'],
        objectives: ['Master C++ fundamentals', 'Build custom game engines', 'Optimize performance'],
        tags: ['C++', 'Game Programming', 'Performance']
      },
      {
        title: 'Python Game Development Fundamentals',
        description: 'Learn game development with Python and Pygame. Perfect for beginners starting their coding journey.',
        price: 49.99,
        difficulty: 'BEGINNER',
        duration: 1800,
        requirements: ['No prior experience needed', 'Python 3.x installed'],
        objectives: ['Learn Python basics', 'Create 2D games with Pygame', 'Understand game loops'],
        tags: ['Python', 'Pygame', 'Beginner Friendly']
      },
      {
        title: 'Advanced Game AI Programming',
        description: 'Implement sophisticated AI systems including pathfinding, behavior trees, and machine learning for games.',
        price: 149.99,
        difficulty: 'ADVANCED',
        duration: 4200,
        requirements: ['Strong programming skills', 'Data structures knowledge', 'Game development experience'],
        objectives: ['Implement A* pathfinding', 'Create behavior trees', 'Integrate ML models'],
        tags: ['AI', 'Machine Learning', 'Advanced']
      },
      {
        title: 'Game Networking and Multiplayer',
        description: 'Build multiplayer games with authoritative servers, client prediction, and lag compensation.',
        price: 119.99,
        difficulty: 'ADVANCED',
        duration: 3800,
        requirements: ['Network programming basics', 'Game development experience'],
        objectives: ['Implement client-server architecture', 'Handle latency', 'Secure multiplayer games'],
        tags: ['Networking', 'Multiplayer', 'Backend']
      },
      {
        title: 'Game Physics Programming',
        description: 'Learn to implement physics systems from scratch including collision detection and rigid body dynamics.',
        price: 89.99,
        difficulty: 'INTERMEDIATE',
        duration: 2800,
        requirements: ['Basic math skills', 'Programming fundamentals'],
        objectives: ['Implement collision systems', 'Create physics engines', 'Optimize simulations'],
        tags: ['Physics', 'Math', 'Simulation']
      }
    ],
    GAME_DESIGN: [
      {
        title: 'Complete Game Design Masterclass',
        description: 'Master core game design principles, player psychology, and balancing. Design engaging experiences.',
        price: 79.99,
        difficulty: 'BEGINNER',
        duration: 2400,
        requirements: ['Passion for games', 'No technical skills required'],
        objectives: ['Understand game mechanics', 'Design balanced systems', 'Create game documents'],
        tags: ['Game Design', 'Mechanics', 'Balancing']
      },
      {
        title: 'Level Design Fundamentals',
        description: 'Create compelling game levels with proper flow, pacing, and player guidance.',
        price: 69.99,
        difficulty: 'BEGINNER',
        duration: 2000,
        requirements: ['Basic game design knowledge', 'Any game engine'],
        objectives: ['Design level layouts', 'Implement player flow', 'Test and iterate'],
        tags: ['Level Design', 'Game Flow', 'Iteration']
      },
      {
        title: 'Advanced Game Systems Design',
        description: 'Design complex game systems including economies, progression, and emergent gameplay.',
        price: 129.99,
        difficulty: 'ADVANCED',
        duration: 3600,
        requirements: ['Game design experience', 'Systems thinking'],
        objectives: ['Design game economies', 'Create progression systems', 'Balance complex mechanics'],
        tags: ['Systems Design', 'Economy', 'Progression']
      },
      {
        title: 'Narrative Design for Games',
        description: 'Craft compelling stories and dialogue systems. Learn branching narratives and player choice.',
        price: 74.99,
        difficulty: 'INTERMEDIATE',
        duration: 2200,
        requirements: ['Writing skills', 'Game design basics'],
        objectives: ['Write game narratives', 'Design dialogue systems', 'Create branching stories'],
        tags: ['Narrative', 'Writing', 'Story']
      },
      {
        title: 'Mobile Game Design Essentials',
        description: 'Design successful mobile games with monetization, retention, and touch controls.',
        price: 59.99,
        difficulty: 'INTERMEDIATE',
        duration: 1800,
        requirements: ['Basic game design knowledge'],
        objectives: ['Design for mobile platforms', 'Implement F2P mechanics', 'Optimize retention'],
        tags: ['Mobile', 'F2P', 'Monetization']
      }
    ],
    GAME_ART: [
      {
        title: '2D Game Art Mastery',
        description: 'Create beautiful 2D game art from sprites to animations. Master pixel art and vector graphics.',
        price: 84.99,
        difficulty: 'BEGINNER',
        duration: 2600,
        requirements: ['Drawing tablet recommended', 'Art software (Photoshop/GIMP)'],
        objectives: ['Create sprite sheets', 'Animate characters', 'Design UI elements'],
        tags: ['2D Art', 'Pixel Art', 'Animation']
      },
      {
        title: '3D Modeling for Games',
        description: 'Learn game-ready 3D modeling with Blender. Create optimized characters and environments.',
        price: 99.99,
        difficulty: 'INTERMEDIATE',
        duration: 3400,
        requirements: ['Blender installed', 'Basic 3D concepts'],
        objectives: ['Model game assets', 'Create UV maps', 'Optimize polygon count'],
        tags: ['3D Modeling', 'Blender', 'Game Assets']
      },
      {
        title: 'Game Texturing and Materials',
        description: 'Master PBR texturing and material creation. Use Substance Painter and Designer professionally.',
        price: 109.99,
        difficulty: 'INTERMEDIATE',
        duration: 2900,
        requirements: ['3D modeling basics', 'Substance suite'],
        objectives: ['Create PBR textures', 'Design tileable materials', 'Optimize texture memory'],
        tags: ['Texturing', 'PBR', 'Substance']
      },
      {
        title: 'Character Art for Games',
        description: 'Design and create memorable game characters from concept to final 3D model.',
        price: 119.99,
        difficulty: 'ADVANCED',
        duration: 4000,
        requirements: ['Strong art fundamentals', '3D modeling experience'],
        objectives: ['Design characters', 'Create high-poly sculpts', 'Retopology and rigging'],
        tags: ['Character Design', 'Sculpting', 'ZBrush']
      },
      {
        title: 'Environment Art Essentials',
        description: 'Build stunning game environments with modular assets and world-building techniques.',
        price: 94.99,
        difficulty: 'INTERMEDIATE',
        duration: 3100,
        requirements: ['3D software knowledge', 'Game engine basics'],
        objectives: ['Create modular assets', 'Build game environments', 'Optimize draw calls'],
        tags: ['Environment Art', 'World Building', 'Modular Design']
      }
    ],
    GAME_AUDIO: [
      {
        title: 'Game Audio Design Fundamentals',
        description: 'Create immersive soundscapes and sound effects for games. Master audio middleware and implementation.',
        price: 79.99,
        difficulty: 'BEGINNER',
        duration: 2200,
        requirements: ['DAW software', 'Headphones or monitors'],
        objectives: ['Design sound effects', 'Implement audio in engines', 'Mix game audio'],
        tags: ['Sound Design', 'Audio', 'SFX']
      },
      {
        title: 'Music Composition for Games',
        description: 'Compose adaptive and interactive game music. Learn orchestration and implementation.',
        price: 89.99,
        difficulty: 'INTERMEDIATE',
        duration: 2800,
        requirements: ['Music theory basics', 'DAW and virtual instruments'],
        objectives: ['Compose game music', 'Create adaptive scores', 'Implement FMOD/Wwise'],
        tags: ['Music', 'Composition', 'Adaptive Audio']
      },
      {
        title: 'Advanced Audio Implementation',
        description: 'Master FMOD and Wwise for professional game audio. Implement complex interactive systems.',
        price: 124.99,
        difficulty: 'ADVANCED',
        duration: 3300,
        requirements: ['Audio design experience', 'Game development knowledge'],
        objectives: ['Master audio middleware', 'Create interactive systems', 'Optimize audio performance'],
        tags: ['FMOD', 'Wwise', 'Implementation']
      },
      {
        title: 'Voice Acting and Dialogue',
        description: 'Direct and edit voice acting for games. Manage dialogue pipelines and localization.',
        price: 69.99,
        difficulty: 'INTERMEDIATE',
        duration: 1900,
        requirements: ['Audio editing software', 'Recording equipment'],
        objectives: ['Direct voice actors', 'Edit dialogue', 'Manage VO pipelines'],
        tags: ['Voice Acting', 'Dialogue', 'Recording']
      },
      {
        title: 'Procedural Audio for Games',
        description: 'Generate dynamic audio content procedurally. Create infinite variations and reactive systems.',
        price: 99.99,
        difficulty: 'ADVANCED',
        duration: 2700,
        requirements: ['Programming skills', 'Audio fundamentals'],
        objectives: ['Generate procedural audio', 'Create reactive systems', 'Optimize real-time audio'],
        tags: ['Procedural', 'Generative', 'Programming']
      }
    ],
    UNITY_DEVELOPMENT: [
      {
        title: 'Unity Beginner Bootcamp',
        description: 'Start your Unity journey with hands-on projects. Build 5 complete games from scratch.',
        price: 64.99,
        difficulty: 'BEGINNER',
        duration: 2100,
        requirements: ['Computer with Unity installed', 'No prior experience needed'],
        objectives: ['Master Unity basics', 'Build complete games', 'Publish to platforms'],
        tags: ['Unity', 'Beginner', 'Game Development']
      },
      {
        title: 'Unity 2D Game Development',
        description: 'Master 2D game development in Unity. Create platformers, puzzles, and mobile games.',
        price: 74.99,
        difficulty: 'INTERMEDIATE',
        duration: 2600,
        requirements: ['Basic Unity knowledge', 'C# fundamentals'],
        objectives: ['Build 2D games', 'Implement physics', 'Create tilemaps'],
        tags: ['Unity', '2D', 'Platformer']
      },
      {
        title: 'Unity 3D Advanced Techniques',
        description: 'Advanced Unity development with custom shaders, optimization, and architectural patterns.',
        price: 139.99,
        difficulty: 'ADVANCED',
        duration: 4100,
        requirements: ['Strong Unity skills', 'C# proficiency', 'Shader knowledge'],
        objectives: ['Write custom shaders', 'Optimize performance', 'Implement design patterns'],
        tags: ['Unity', 'Advanced', 'Shaders']
      },
      {
        title: 'Unity VR Development',
        description: 'Build immersive VR experiences with Unity and XR Toolkit. Support multiple VR platforms.',
        price: 109.99,
        difficulty: 'INTERMEDIATE',
        duration: 3000,
        requirements: ['Unity experience', 'VR headset recommended'],
        objectives: ['Build VR applications', 'Implement teleportation', 'Optimize for VR'],
        tags: ['Unity', 'VR', 'XR Toolkit']
      },
      {
        title: 'Unity Multiplayer with Netcode',
        description: 'Create multiplayer games using Unity Netcode for GameObjects. Implement authoritative servers.',
        price: 119.99,
        difficulty: 'ADVANCED',
        duration: 3500,
        requirements: ['Unity proficiency', 'Networking basics'],
        objectives: ['Implement multiplayer', 'Handle synchronization', 'Create dedicated servers'],
        tags: ['Unity', 'Multiplayer', 'Netcode']
      }
    ],
    UNREAL_DEVELOPMENT: [
      {
        title: 'Unreal Engine 5 for Beginners',
        description: 'Learn Unreal Engine 5 with Blueprints. No coding required to create stunning games.',
        price: 79.99,
        difficulty: 'BEGINNER',
        duration: 2500,
        requirements: ['Powerful PC', 'Unreal Engine 5 installed'],
        objectives: ['Master Blueprints', 'Use Nanite and Lumen', 'Build complete games'],
        tags: ['Unreal', 'Blueprints', 'Beginner']
      },
      {
        title: 'Unreal C++ Game Development',
        description: 'Master Unreal Engine with C++ programming. Build professional AAA-quality systems.',
        price: 134.99,
        difficulty: 'ADVANCED',
        duration: 4300,
        requirements: ['C++ knowledge', 'Unreal basics', 'Strong programming skills'],
        objectives: ['Master Unreal C++', 'Create gameplay systems', 'Optimize performance'],
        tags: ['Unreal', 'C++', 'AAA']
      },
      {
        title: 'Unreal Blueprint Mastery',
        description: 'Advanced Blueprint techniques for complex game systems without coding.',
        price: 89.99,
        difficulty: 'INTERMEDIATE',
        duration: 2900,
        requirements: ['Basic Unreal knowledge', 'Blueprint fundamentals'],
        objectives: ['Create advanced systems', 'Optimize Blueprints', 'Integrate C++'],
        tags: ['Unreal', 'Blueprints', 'Visual Scripting']
      },
      {
        title: 'Unreal Environments and Landscapes',
        description: 'Create breathtaking open-world environments with Unreal Engine 5 landscape tools.',
        price: 99.99,
        difficulty: 'INTERMEDIATE',
        duration: 3200,
        requirements: ['Unreal basics', '3D art fundamentals'],
        objectives: ['Design landscapes', 'Use Nanite for detail', 'Optimize large worlds'],
        tags: ['Unreal', 'Environment', 'Landscape']
      },
      {
        title: 'Unreal Animation and Rigging',
        description: 'Implement character animation systems with Animation Blueprints and Control Rig.',
        price: 109.99,
        difficulty: 'ADVANCED',
        duration: 3400,
        requirements: ['Unreal experience', 'Animation basics'],
        objectives: ['Create animation systems', 'Implement IK', 'Use Control Rig'],
        tags: ['Unreal', 'Animation', 'Rigging']
      }
    ],
    GODOT_DEVELOPMENT: [
      {
        title: 'Godot 4 Complete Guide',
        description: 'Master Godot 4 with GDScript. Build 2D and 3D games with this powerful open-source engine.',
        price: 59.99,
        difficulty: 'BEGINNER',
        duration: 2300,
        requirements: ['Godot 4 installed', 'Basic computer skills'],
        objectives: ['Learn GDScript', 'Build 2D and 3D games', 'Export to platforms'],
        tags: ['Godot', 'GDScript', 'Open Source']
      },
      {
        title: 'Godot 2D Game Development',
        description: 'Create beautiful 2D games with Godot. Master nodes, signals, and scene management.',
        price: 49.99,
        difficulty: 'BEGINNER',
        duration: 1900,
        requirements: ['Godot installed', 'No prior experience'],
        objectives: ['Master 2D nodes', 'Implement game mechanics', 'Create pixel-perfect games'],
        tags: ['Godot', '2D', 'Indie']
      },
      {
        title: 'Godot 3D and Shaders',
        description: 'Build 3D games and write custom shaders in Godot 4. Master the visual shader editor.',
        price: 84.99,
        difficulty: 'INTERMEDIATE',
        duration: 2800,
        requirements: ['Godot basics', '3D concepts'],
        objectives: ['Create 3D games', 'Write shaders', 'Optimize rendering'],
        tags: ['Godot', '3D', 'Shaders']
      },
      {
        title: 'Godot Multiplayer Networking',
        description: 'Implement multiplayer games with Godot high-level networking API.',
        price: 79.99,
        difficulty: 'INTERMEDIATE',
        duration: 2400,
        requirements: ['Godot proficiency', 'Networking basics'],
        objectives: ['Create multiplayer games', 'Handle synchronization', 'Implement lobbies'],
        tags: ['Godot', 'Multiplayer', 'Networking']
      },
      {
        title: 'Advanced Godot C# Development',
        description: 'Use C# with Godot for performance-critical systems and enterprise integration.',
        price: 94.99,
        difficulty: 'ADVANCED',
        duration: 3100,
        requirements: ['C# knowledge', 'Godot experience'],
        objectives: ['Integrate C# with Godot', 'Optimize performance', 'Use .NET libraries'],
        tags: ['Godot', 'C#', 'Performance']
      }
    ],
    MOBILE_GAMES: [
      {
        title: 'Complete Mobile Game Development',
        description: 'Build and publish successful mobile games for iOS and Android. Master touch controls and monetization.',
        price: 89.99,
        difficulty: 'INTERMEDIATE',
        duration: 2900,
        requirements: ['Unity or Unreal basics', 'Mobile device for testing'],
        objectives: ['Build mobile games', 'Implement IAP', 'Publish to stores'],
        tags: ['Mobile', 'iOS', 'Android']
      },
      {
        title: 'Casual Mobile Game Design',
        description: 'Design addictive casual games with proven mechanics. Learn retention and monetization.',
        price: 69.99,
        difficulty: 'BEGINNER',
        duration: 2000,
        requirements: ['Game design basics', 'Mobile device'],
        objectives: ['Design casual mechanics', 'Implement F2P model', 'Optimize retention'],
        tags: ['Mobile', 'Casual', 'F2P']
      },
      {
        title: 'Mobile Game Performance',
        description: 'Optimize mobile games for battery life, frame rate, and device compatibility.',
        price: 99.99,
        difficulty: 'ADVANCED',
        duration: 2700,
        requirements: ['Mobile game development', 'Profiling tools'],
        objectives: ['Optimize performance', 'Reduce battery drain', 'Support low-end devices'],
        tags: ['Mobile', 'Optimization', 'Performance']
      },
      {
        title: 'Mobile AR Game Development',
        description: 'Create augmented reality games with ARCore and ARKit. Build location-based experiences.',
        price: 114.99,
        difficulty: 'INTERMEDIATE',
        duration: 3300,
        requirements: ['Unity experience', 'AR-capable device'],
        objectives: ['Implement AR features', 'Create location games', 'Handle real-world tracking'],
        tags: ['Mobile', 'AR', 'Location-Based']
      },
      {
        title: 'Mobile Game Monetization',
        description: 'Master mobile monetization strategies including ads, IAP, and subscription models.',
        price: 74.99,
        difficulty: 'INTERMEDIATE',
        duration: 1800,
        requirements: ['Published mobile game', 'Analytics tools'],
        objectives: ['Implement monetization', 'Optimize ARPU', 'Balance gameplay and revenue'],
        tags: ['Mobile', 'Monetization', 'Analytics']
      }
    ],
    INDIE_DEVELOPMENT: [
      {
        title: 'Solo Indie Game Development',
        description: 'Learn to build and ship games as a solo developer. Cover all aspects from code to marketing.',
        price: 79.99,
        difficulty: 'INTERMEDIATE',
        duration: 3000,
        requirements: ['Basic game dev skills', 'Self-motivation'],
        objectives: ['Manage solo projects', 'Market indie games', 'Ship complete games'],
        tags: ['Indie', 'Solo Dev', 'Marketing']
      },
      {
        title: 'Game Marketing for Indies',
        description: 'Market your indie game effectively. Build community, run campaigns, and get press coverage.',
        price: 64.99,
        difficulty: 'BEGINNER',
        duration: 1600,
        requirements: ['Game project in development'],
        objectives: ['Build community', 'Create marketing materials', 'Run launch campaigns'],
        tags: ['Indie', 'Marketing', 'Community']
      },
      {
        title: 'Rapid Game Prototyping',
        description: 'Quickly prototype game ideas to test fun and viability. Perfect for game jams and MVP creation.',
        price: 54.99,
        difficulty: 'INTERMEDIATE',
        duration: 1500,
        requirements: ['Game engine knowledge', 'Design basics'],
        objectives: ['Prototype quickly', 'Test game mechanics', 'Iterate on feedback'],
        tags: ['Indie', 'Prototyping', 'Game Jams']
      },
      {
        title: 'Kickstarter for Game Developers',
        description: 'Launch successful crowdfunding campaigns for your indie game. From campaign to fulfillment.',
        price: 69.99,
        difficulty: 'BEGINNER',
        duration: 1700,
        requirements: ['Game prototype', 'Marketing basics'],
        objectives: ['Create campaigns', 'Build backer community', 'Manage fulfillment'],
        tags: ['Indie', 'Kickstarter', 'Crowdfunding']
      },
      {
        title: 'Steam Success for Indie Devs',
        description: 'Navigate Steam launch, optimize store page, and maximize wishlists and sales.',
        price: 84.99,
        difficulty: 'INTERMEDIATE',
        duration: 2100,
        requirements: ['Game near completion', 'Steamworks account'],
        objectives: ['Optimize Steam page', 'Build wishlists', 'Launch successfully'],
        tags: ['Indie', 'Steam', 'Publishing']
      }
    ],
    VR_AR_DEVELOPMENT: [
      {
        title: 'VR Game Development Fundamentals',
        description: 'Build immersive VR games for Quest, PSVR, and PC VR. Master locomotion and interaction.',
        price: 109.99,
        difficulty: 'INTERMEDIATE',
        duration: 3200,
        requirements: ['Game engine experience', 'VR headset'],
        objectives: ['Create VR games', 'Implement comfort features', 'Support multiple platforms'],
        tags: ['VR', 'XR', 'Immersive']
      },
      {
        title: 'AR Game Development',
        description: 'Create engaging AR experiences with ARCore, ARKit, and location-based gameplay.',
        price: 99.99,
        difficulty: 'INTERMEDIATE',
        duration: 2800,
        requirements: ['Mobile development', 'AR-capable device'],
        objectives: ['Build AR apps', 'Implement plane detection', 'Create location games'],
        tags: ['AR', 'Mobile', 'Location']
      },
      {
        title: 'VR Interaction Design',
        description: 'Design intuitive VR interactions and UI. Master hand tracking and controller input.',
        price: 89.99,
        difficulty: 'ADVANCED',
        duration: 2500,
        requirements: ['VR development basics', 'UX knowledge'],
        objectives: ['Design VR interactions', 'Implement hand tracking', 'Create VR UI'],
        tags: ['VR', 'UX', 'Interaction']
      },
      {
        title: 'Mixed Reality Development',
        description: 'Build mixed reality experiences for HoloLens and Quest 3. Blend digital and physical worlds.',
        price: 129.99,
        difficulty: 'ADVANCED',
        duration: 3600,
        requirements: ['XR development', 'Spatial computing concepts'],
        objectives: ['Create MR apps', 'Implement passthrough', 'Handle spatial anchors'],
        tags: ['MR', 'HoloLens', 'Spatial']
      },
      {
        title: 'VR Performance Optimization',
        description: 'Achieve smooth 90fps+ in VR. Master rendering techniques and performance profiling.',
        price: 119.99,
        difficulty: 'ADVANCED',
        duration: 3100,
        requirements: ['VR development', 'Graphics programming'],
        objectives: ['Optimize VR rendering', 'Maintain high framerates', 'Reduce latency'],
        tags: ['VR', 'Performance', 'Optimization']
      }
    ]
  }

  // Helper functions for comprehensive module and lesson generation

  const lessonTypes: ('VIDEO' | 'INTERACTIVE' | 'QUIZ' | 'PROJECT' | 'READING')[] = ['VIDEO', 'INTERACTIVE', 'QUIZ', 'PROJECT', 'READING']

  function randomDuration(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  function generateLessonsByType(moduleTitle: string, lessonCount: number, moduleOrder: number): any[] {
    const lessons = []
    const lessonTypeDistribution = [
      { type: 'VIDEO', weight: 0.5 },      // 50% video lessons
      { type: 'READING', weight: 0.2 },    // 20% reading
      { type: 'INTERACTIVE', weight: 0.15 }, // 15% interactive
      { type: 'QUIZ', weight: 0.1 },       // 10% quiz
      { type: 'PROJECT', weight: 0.05 }    // 5% projects
    ]

    for (let i = 0; i < lessonCount; i++) {
      const rand = Math.random()
      let cumulative = 0
      let lessonType: 'VIDEO' | 'INTERACTIVE' | 'QUIZ' | 'PROJECT' | 'READING' = 'VIDEO'

      for (const dist of lessonTypeDistribution) {
        cumulative += dist.weight
        if (rand <= cumulative) {
          lessonType = dist.type as any
          break
        }
      }

      const lessonNumber = i + 1
      const lesson = generateLesson(moduleTitle, lessonType, lessonNumber, moduleOrder)
      lessons.push(lesson)
    }

    return lessons
  }

  function generateLesson(moduleTitle: string, lessonType: string, order: number, moduleOrder: number): any {
    const baseTitles = {
      VIDEO: ['Introduction to', 'Understanding', 'Deep Dive into', 'Mastering', 'Exploring', 'Advanced'],
      READING: ['Reading:', 'Documentation:', 'Guide to', 'Best Practices for', 'Reference:'],
      INTERACTIVE: ['Hands-on:', 'Lab:', 'Exercise:', 'Practice:', 'Workshop:'],
      QUIZ: ['Quiz:', 'Assessment:', 'Knowledge Check:', 'Test Your Skills:', 'Review:'],
      PROJECT: ['Project:', 'Build:', 'Create:', 'Implement:', 'Challenge:']
    }

    const topic = moduleTitle.replace(/Module \d+:/, '').trim()
    const titlePrefix = baseTitles[lessonType as keyof typeof baseTitles][Math.floor(Math.random() * baseTitles[lessonType as keyof typeof baseTitles].length)]

    const title = `${titlePrefix} ${topic} - Part ${order}`
    const description = `Detailed coverage of ${topic.toLowerCase()} concepts and practical applications`
    const duration = randomDuration(15, 90)

    const baseLesson = {
      title,
      description,
      type: lessonType,
      order,
      duration
    }

    switch (lessonType) {
      case 'VIDEO':
        return {
          ...baseLesson,
          videoUrl: `/videos/modules/${moduleOrder}/lessons/${order}.mp4`,
          content: JSON.stringify({
            videoUrl: `/videos/modules/${moduleOrder}/lessons/${order}.mp4`,
            subtitles: `/videos/modules/${moduleOrder}/lessons/${order}.vtt`,
            quality: ['1080p', '720p', '480p']
          }),
          resources: {
            create: [
              {
                title: 'Lesson Slides',
                url: `/resources/slides/${moduleOrder}-${order}.pdf`,
                type: 'document',
                order: 1
              },
              {
                title: 'Source Code',
                url: `/resources/code/${moduleOrder}-${order}.zip`,
                type: 'download',
                order: 2
              }
            ]
          }
        }

      case 'READING':
        return {
          ...baseLesson,
          content: JSON.stringify({
            markdown: `# ${title}\n\nComprehensive reading material covering key concepts...`,
            estimatedReadTime: Math.floor(duration / 2),
            references: [
              `Reference Material 1`,
              `Reference Material 2`
            ]
          }),
          resources: {
            create: [
              {
                title: 'Reading Material PDF',
                url: `/resources/reading/${moduleOrder}-${order}.pdf`,
                type: 'document',
                order: 1
              }
            ]
          }
        }

      case 'INTERACTIVE':
        return {
          ...baseLesson,
          content: JSON.stringify({
            interactiveType: 'code-editor',
            template: '// Your code here',
            solution: '// Solution code',
            tests: ['Test 1', 'Test 2']
          }),
          resources: {
            create: [
              {
                title: 'Starter Template',
                url: `/resources/interactive/${moduleOrder}-${order}-starter.zip`,
                type: 'download',
                order: 1
              }
            ]
          }
        }

      case 'QUIZ':
        return {
          ...baseLesson,
          content: JSON.stringify({
            questions: [
              {
                question: 'Sample question 1',
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 0
              },
              {
                question: 'Sample question 2',
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 1
              }
            ]
          }),
          quiz: {
            create: {
              title: title,
              description: 'Test your understanding of the module concepts',
              questions: JSON.stringify([
                {
                  id: 1,
                  question: `What is the key concept in ${topic}?`,
                  type: 'multiple-choice',
                  options: ['Option A', 'Option B', 'Option C', 'Option D'],
                  correctAnswer: 0,
                  explanation: 'Detailed explanation of the correct answer'
                },
                {
                  id: 2,
                  question: `How do you implement ${topic}?`,
                  type: 'multiple-choice',
                  options: ['Method A', 'Method B', 'Method C', 'Method D'],
                  correctAnswer: 1,
                  explanation: 'Step-by-step explanation'
                }
              ]),
              timeLimit: 30,
              passingScore: 70
            }
          }
        }

      case 'PROJECT':
        return {
          ...baseLesson,
          content: JSON.stringify({
            projectType: 'guided-build',
            requirements: [
              'Requirement 1',
              'Requirement 2',
              'Requirement 3'
            ],
            deliverables: [
              'Deliverable 1',
              'Deliverable 2'
            ]
          }),
          resources: {
            create: [
              {
                title: 'Project Starter Kit',
                url: `/resources/projects/${moduleOrder}-${order}-starter.zip`,
                type: 'download',
                order: 1
              },
              {
                title: 'Project Assets',
                url: `/resources/projects/${moduleOrder}-${order}-assets.zip`,
                type: 'download',
                order: 2
              }
            ]
          }
        }

      default:
        return baseLesson
    }
  }

  function generateModules(template: any, difficulty: string): any[] {
    // Determine number of modules based on difficulty and course duration
    const baseDuration = template.duration
    let moduleCount: number

    if (difficulty === 'BEGINNER') {
      moduleCount = Math.floor(Math.random() * 2) + 3 // 3-4 modules
    } else if (difficulty === 'INTERMEDIATE') {
      moduleCount = Math.floor(Math.random() * 3) + 4 // 4-6 modules
    } else {
      moduleCount = Math.floor(Math.random() * 3) + 6 // 6-8 modules
    }

    const modules = []
    const moduleTemplates = [
      { title: 'Introduction and Setup', description: 'Getting started with course fundamentals' },
      { title: 'Core Concepts', description: 'Essential concepts and theories' },
      { title: 'Practical Fundamentals', description: 'Hands-on practice with basic techniques' },
      { title: 'Intermediate Techniques', description: 'Building on core knowledge' },
      { title: 'Advanced Topics', description: 'Deep dive into advanced concepts' },
      { title: 'Real-World Applications', description: 'Applying skills to practical scenarios' },
      { title: 'Optimization and Best Practices', description: 'Professional-level techniques' },
      { title: 'Final Project', description: 'Comprehensive capstone project' }
    ]

    const totalModuleDuration = baseDuration
    const durationPerModule = Math.floor(totalModuleDuration / moduleCount)

    for (let i = 0; i < moduleCount; i++) {
      const moduleTemplate = moduleTemplates[i] || moduleTemplates[moduleTemplates.length - 1]
      const lessonCount = Math.floor(Math.random() * 9) + 4 // 4-12 lessons per module

      const lessons = generateLessonsByType(
        `Module ${i + 1}: ${moduleTemplate.title}`,
        lessonCount,
        i + 1
      )

      // Calculate actual module duration from lessons
      const calculatedDuration = lessons.reduce((sum: number, lesson: any) => sum + (lesson.duration || 30), 0)

      modules.push({
        title: `${moduleTemplate.title}`,
        description: moduleTemplate.description,
        order: i + 1,
        duration: calculatedDuration,
        lessons: {
          create: lessons
        }
      })
    }

    return modules
  }

  // Main course data generation function
  function generateCourseData(category: string, template: any, instructor: any) {
    const modules = generateModules(template, template.difficulty)

    // Calculate total duration from all modules
    const calculatedDuration = modules.reduce((sum: number, module: any) => sum + module.duration, 0)

    return {
      title: template.title,
      description: template.description,
      thumbnail: '/api/placeholder/400/225',
      price: template.price,
      published: true,
      category: category,
      engine: category.includes('UNITY') ? 'UNITY' : category.includes('UNREAL') ? 'UNREAL' : category.includes('GODOT') ? 'GODOT' : null,
      difficulty: template.difficulty,
      duration: calculatedDuration, // Use calculated duration from lessons
      requirements: {
        create: template.requirements.map((req: string, idx: number) => ({
          requirement: req,
          order: idx + 1
        }))
      },
      objectives: {
        create: template.objectives.map((obj: string, idx: number) => ({
          objective: obj,
          order: idx + 1
        }))
      },
      tags: {
        create: template.tags.map((tag: string) => ({ tag }))
      },
      instructorId: instructor.id,
      modules: {
        create: modules
      }
    }
  }

  // Determine instructor assignments for courses
  const courseInstructors = [instructorUnity, instructorUnreal, instructorDesign, instructorGodot]
  const instructorMap: { [key: string]: any } = {
    GAME_PROGRAMMING: instructorUnity,
    GAME_DESIGN: instructorDesign,
    GAME_ART: instructorUnreal,
    GAME_AUDIO: instructorDesign,
    UNITY_DEVELOPMENT: instructorUnity,
    UNREAL_DEVELOPMENT: instructorUnreal,
    GODOT_DEVELOPMENT: instructorGodot,
    MOBILE_GAMES: instructorUnity,
    INDIE_DEVELOPMENT: instructorDesign,
    VR_AR_DEVELOPMENT: instructorUnreal
  }

  // Generate all courses (50+)
  console.log('📚 Generating comprehensive course catalog...')
  const allCourses: any[] = []

  for (const [category, templates] of Object.entries(courseTemplates)) {
    const instructor = instructorMap[category] || courseInstructors[0]

    for (const template of templates) {
      const courseData = generateCourseData(category, template, instructor)
      const course = await prisma.course.create({
        data: courseData,
        include: {
          modules: {
            include: {
              lessons: true
            }
          }
        }
      })
      allCourses.push(course)
      console.log(`  ✓ Created: ${course.title}`)
    }
  }

  console.log(`✅ Created ${allCourses.length} courses across all categories`)

  // Keep original course references for backward compatibility with existing seed data
  const unityCourse = allCourses.find(c => c.category === 'UNITY_DEVELOPMENT') || allCourses[0]
  const unrealCourse = allCourses.find(c => c.category === 'UNREAL_DEVELOPMENT') || allCourses[0]
  const gameDesignCourse = allCourses.find(c => c.category === 'GAME_DESIGN') || allCourses[0]
  const godotCourse = allCourses.find(c => c.category === 'GODOT_DEVELOPMENT') || allCourses[0]
  const mobileCourse = allCourses.find(c => c.category === 'MOBILE_GAMES') || allCourses[0]

  // Legacy course creation removed - now using template system above

  // Create comprehensive courses (LEGACY - keeping for reference, but courses now generated above)
  /*const unityCourse = await prisma.course.create({
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
      requirements: {
        create: [
          { requirement: 'Basic computer skills', order: 1 },
          { requirement: 'Windows or Mac computer', order: 2 },
        ],
      },
      objectives: {
        create: [
          { objective: 'Master Unity interface', order: 1 },
          { objective: 'Build complete games', order: 2 },
          { objective: 'Publish to app stores', order: 3 },
        ],
      },
      tags: {
        create: [
          { tag: 'Unity' },
          { tag: 'C#' },
          { tag: 'Game Development' },
          { tag: 'Beginner' },
        ],
      },
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
      requirements: {
        create: [
          { requirement: 'Basic programming knowledge', order: 1 },
          { requirement: 'Powerful PC/Mac', order: 2 },
          { requirement: '16GB RAM recommended', order: 3 },
        ],
      },
      objectives: {
        create: [
          { objective: 'Master UE5 features', order: 1 },
          { objective: 'Create photorealistic environments', order: 2 },
          { objective: 'Build complete games', order: 3 },
        ],
      },
      tags: {
        create: [
          { tag: 'Unreal Engine' },
          { tag: 'UE5' },
          { tag: 'Blueprints' },
          { tag: 'C++' },
          { tag: 'Advanced' },
        ],
      },
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
      requirements: {
        create: [
          { requirement: 'Creative mindset', order: 1 },
          { requirement: 'Basic understanding of games', order: 2 },
        ],
      },
      objectives: {
        create: [
          { objective: 'Understand game design principles', order: 1 },
          { objective: 'Create game documents', order: 2 },
          { objective: 'Design balanced gameplay', order: 3 },
        ],
      },
      tags: {
        create: [
          { tag: 'Game Design' },
          { tag: 'Level Design' },
          { tag: 'UX' },
          { tag: 'Psychology' },
          { tag: 'Theory' },
        ],
      },
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
      requirements: {
        create: [
          { requirement: 'Basic programming concepts', order: 1 },
          { requirement: 'Any computer', order: 2 },
        ],
      },
      objectives: {
        create: [
          { objective: 'Master Godot 4', order: 1 },
          { objective: 'Learn GDScript', order: 2 },
          { objective: 'Build complete games', order: 3 },
          { objective: 'Publish indie games', order: 4 },
        ],
      },
      tags: {
        create: [
          { tag: 'Godot' },
          { tag: 'GDScript' },
          { tag: 'Open Source' },
          { tag: 'Indie' },
          { tag: '2D' },
          { tag: '3D' },
        ],
      },
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
      requirements: {
        create: [
          { requirement: 'Unity basics', order: 1 },
          { requirement: 'C# programming', order: 2 },
          { requirement: 'Mobile device for testing', order: 3 },
        ],
      },
      objectives: {
        create: [
          { objective: 'Build mobile games', order: 1 },
          { objective: 'Implement monetization', order: 2 },
          { objective: 'Optimize performance', order: 3 },
          { objective: 'Publish to stores', order: 4 },
        ],
      },
      tags: {
        create: [
          { tag: 'Mobile' },
          { tag: 'Unity' },
          { tag: 'iOS' },
          { tag: 'Android' },
          { tag: 'Monetization' },
          { tag: 'Publishing' },
        ],
      },
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
  })*/

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
            featured: true,
            tags: {
              create: [
                { tag: 'Unity' },
                { tag: '2D' },
                { tag: 'Space' },
                { tag: 'Shooter' },
                { tag: 'Retro' },
              ],
            },
          },
          {
            title: 'Pixel Platformer',
            description: 'A challenging 2D platformer with hand-drawn pixel art and tight controls.',
            thumbnail: '/api/placeholder/300/200',
            engine: 'UNITY',
            webglBuild: '/games/pixel-platformer',
            sourceCode: 'https://github.com/alex-thompson/pixel-platformer',
            tags: {
              create: [
                { tag: 'Unity' },
                { tag: '2D' },
                { tag: 'Platformer' },
                { tag: 'Pixel Art' },
                { tag: 'Indie' },
              ],
            },
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
            featured: true,
            tags: {
              create: [
                { tag: 'Unreal Engine' },
                { tag: 'VR' },
                { tag: 'Puzzle' },
                { tag: 'Photorealistic' },
              ],
            },
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
        authorId: studentUser1.id,
        likes: 12,
        views: 89,
        tags: {
          create: [
            { tag: 'Unity' },
            { tag: 'Performance' },
            { tag: 'Mobile' },
            { tag: 'Optimization' },
          ],
        },
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
        authorId: studentUser2.id,
        likes: 24,
        views: 156,
        tags: {
          create: [
            { tag: 'Godot' },
            { tag: 'Unity' },
            { tag: '2D' },
            { tag: 'Comparison' },
          ],
        },
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