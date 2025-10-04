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
    },
    {
      email: 'harper.scott@student.com',
      name: 'Harper Scott',
      bio: 'Game AI programmer interested in machine learning for NPCs',
      location: 'Tokyo, Japan',
      skills: ['C++', 'Python', 'AI Programming', 'Machine Learning'],
      interests: ['GAME_PROGRAMMING']
    },
    {
      email: 'evelyn.green@student.com',
      name: 'Evelyn Green',
      bio: 'UI/UX designer specializing in game interfaces',
      location: 'Dublin, Ireland',
      skills: ['UI Design', 'UX Research', 'Figma', 'Unity UI'],
      interests: ['GAME_DESIGN', 'GAME_ART']
    },
    {
      email: 'sebastian.baker@student.com',
      name: 'Sebastian Baker',
      bio: 'Multiplayer game programmer learning netcode and server architecture',
      location: 'Zurich, Switzerland',
      skills: ['C#', 'Networking', 'Server Development', 'Unity'],
      interests: ['GAME_PROGRAMMING', 'UNITY_DEVELOPMENT']
    },
    {
      email: 'aria.nelson@student.com',
      name: 'Aria Nelson',
      bio: 'Level designer creating challenging platformer experiences',
      location: 'Oslo, Norway',
      skills: ['Level Design', 'Unity', 'Game Design', 'Playtesting'],
      interests: ['GAME_DESIGN', 'UNITY_DEVELOPMENT']
    },
    {
      email: 'james.mitchell@student.com',
      name: 'James Mitchell',
      bio: 'Blockchain game developer exploring NFT integration',
      location: 'Dubai, UAE',
      skills: ['Solidity', 'Web3', 'Unity', 'Smart Contracts'],
      interests: ['GAME_PROGRAMMING', 'MOBILE_GAMES']
    },
    {
      email: 'scarlett.carter@student.com',
      name: 'Scarlett Carter',
      bio: 'Character artist mastering stylized art for games',
      location: 'Paris, France',
      skills: ['Character Design', 'ZBrush', '3D Modeling', 'Texturing'],
      interests: ['GAME_ART']
    },
    {
      email: 'elijah.perez@student.com',
      name: 'Elijah Perez',
      bio: 'Procedural generation enthusiast building infinite worlds',
      location: 'São Paulo, Brazil',
      skills: ['C#', 'Procedural Generation', 'Mathematics', 'Unity'],
      interests: ['GAME_PROGRAMMING', 'INDIE_DEVELOPMENT']
    },
    {
      email: 'lily.roberts@student.com',
      name: 'Lily Roberts',
      bio: 'Game producer learning project management for indie teams',
      location: 'Melbourne, Australia',
      skills: ['Project Management', 'Agile', 'Team Coordination', 'Trello'],
      interests: ['GAME_DESIGN']
    },
    {
      email: 'william.turner@student.com',
      name: 'William Turner',
      bio: 'Technical artist bridging art and programming',
      location: 'Montreal, Canada',
      skills: ['Shader Development', 'Python', 'Maya', 'Unreal Engine'],
      interests: ['GAME_ART', 'UNREAL_DEVELOPMENT']
    },
    {
      email: 'grace.phillips@student.com',
      name: 'Grace Phillips',
      bio: 'VR interaction designer focusing on hand tracking',
      location: 'Seoul, South Korea',
      skills: ['VR Development', 'Unity', 'UX Design', 'Hand Tracking'],
      interests: ['VR_AR_DEVELOPMENT']
    },
    {
      email: 'henry.campbell@student.com',
      name: 'Henry Campbell',
      bio: 'Game economy designer balancing virtual currencies',
      location: 'Singapore',
      skills: ['Economics', 'Game Design', 'Analytics', 'Excel'],
      interests: ['GAME_DESIGN', 'MOBILE_GAMES']
    },
    {
      email: 'zoey.parker@student.com',
      name: 'Zoey Parker',
      bio: 'Environment artist creating immersive fantasy worlds',
      location: 'Reykjavik, Iceland',
      skills: ['Environment Art', 'Unreal Engine', 'Landscape Design', 'Lighting'],
      interests: ['GAME_ART', 'UNREAL_DEVELOPMENT']
    },
    {
      email: 'jack.evans@student.com',
      name: 'Jack Evans',
      bio: 'AR developer building mobile augmented reality games',
      location: 'San Diego, CA',
      skills: ['AR Foundation', 'Unity', 'C#', 'Computer Vision'],
      interests: ['VR_AR_DEVELOPMENT', 'MOBILE_GAMES']
    },
    {
      email: 'luna.edwards@student.com',
      name: 'Luna Edwards',
      bio: 'Accessibility advocate ensuring games are playable by everyone',
      location: 'Brussels, Belgium',
      skills: ['Game Design', 'Accessibility Testing', 'Unity', 'User Research'],
      interests: ['GAME_DESIGN']
    },
    {
      email: 'daniel.collins@student.com',
      name: 'Daniel Collins',
      bio: 'Performance optimization specialist for mobile games',
      location: 'Bangalore, India',
      skills: ['Optimization', 'Profiling', 'Unity', 'Mobile Development'],
      interests: ['MOBILE_GAMES', 'GAME_PROGRAMMING']
    },
    {
      email: 'stella.stewart@student.com',
      name: 'Stella Stewart',
      bio: 'Narrative designer crafting branching storylines',
      location: 'Prague, Czech Republic',
      skills: ['Writing', 'Narrative Design', 'Ink Language', 'Dialogue Systems'],
      interests: ['GAME_DESIGN']
    },
    {
      email: 'matthew.morris@student.com',
      name: 'Matthew Morris',
      bio: 'Godot plugin developer contributing to the ecosystem',
      location: 'Wellington, New Zealand',
      skills: ['Godot', 'GDScript', 'C++', 'Plugin Development'],
      interests: ['GODOT_DEVELOPMENT', 'INDIE_DEVELOPMENT']
    },
    {
      email: 'hazel.cook@student.com',
      name: 'Hazel Cook',
      bio: 'Combat designer creating satisfying melee systems',
      location: 'Lisbon, Portugal',
      skills: ['Combat Design', 'Animation', 'Unity', 'Game Feel'],
      interests: ['GAME_DESIGN', 'GAME_PROGRAMMING']
    },
    {
      email: 'samuel.rogers@student.com',
      name: 'Samuel Rogers',
      bio: 'VFX artist creating stunning particle effects',
      location: 'Warsaw, Poland',
      skills: ['VFX', 'Particle Systems', 'Shaders', 'Unity'],
      interests: ['GAME_ART', 'UNITY_DEVELOPMENT']
    },
    {
      email: 'nora.reed@student.com',
      name: 'Nora Reed',
      bio: 'Esports enthusiast designing competitive FPS mechanics',
      location: 'Los Angeles, CA',
      skills: ['Game Design', 'Balancing', 'Unreal Engine', 'Competitive Analysis'],
      interests: ['GAME_DESIGN', 'UNREAL_DEVELOPMENT']
    },
    {
      email: 'wyatt.bailey@student.com',
      name: 'Wyatt Bailey',
      bio: 'Rhythm game developer passionate about music and gameplay',
      location: 'Austin, TX',
      skills: ['Unity', 'Audio Programming', 'Music Theory', 'C#'],
      interests: ['GAME_PROGRAMMING', 'MOBILE_GAMES']
    },
    {
      email: 'violet.rivera@student.com',
      name: 'Violet Rivera',
      bio: 'Localization specialist making games accessible worldwide',
      location: 'Madrid, Spain',
      skills: ['Localization', 'Translation', 'Cultural Adaptation', 'Project Management'],
      interests: ['GAME_DESIGN']
    },
    {
      email: 'owen.cooper@student.com',
      name: 'Owen Cooper',
      bio: 'Physics programmer building realistic vehicle simulations',
      location: 'Detroit, MI',
      skills: ['Physics Programming', 'C++', 'Mathematics', 'Unreal Engine'],
      interests: ['GAME_PROGRAMMING', 'UNREAL_DEVELOPMENT']
    },
    {
      email: 'aurora.richardson@student.com',
      name: 'Aurora Richardson',
      bio: 'Pixel artist creating retro-style game graphics',
      location: 'Kyoto, Japan',
      skills: ['Pixel Art', 'Aseprite', 'Animation', 'Color Theory'],
      interests: ['GAME_ART', 'INDIE_DEVELOPMENT']
    },
    {
      email: 'dylan.cox@student.com',
      name: 'Dylan Cox',
      bio: 'Roguelike developer studying procedural content generation',
      location: 'Portland, OR',
      skills: ['C#', 'Procedural Generation', 'Unity', 'Game Design'],
      interests: ['GAME_PROGRAMMING', 'INDIE_DEVELOPMENT']
    },
    {
      email: 'penelope.howard@student.com',
      name: 'Penelope Howard',
      bio: 'Social game designer creating engaging multiplayer experiences',
      location: 'Stockholm, Sweden',
      skills: ['Social Design', 'Psychology', 'Unity', 'Analytics'],
      interests: ['GAME_DESIGN', 'MOBILE_GAMES']
    },
    {
      email: 'leo.ward@student.com',
      name: 'Leo Ward',
      bio: 'Game tools programmer building editor extensions',
      location: 'Seattle, WA',
      skills: ['C#', 'Unity Editor', 'Tool Development', 'Python'],
      interests: ['GAME_PROGRAMMING', 'UNITY_DEVELOPMENT']
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

  // ==================== Comprehensive Community Features Generation ====================
  console.log('\n🌐 Generating comprehensive community features...')

  // Forum post titles and content templates
  const forumPostTemplates = {
    Unity: [
      { title: 'How to implement save/load system in Unity?', content: 'Looking for best practices for implementing a persistent save system. Should I use PlayerPrefs, JSON, or binary serialization?' },
      { title: 'Unity UI Toolkit vs uGUI in 2024', content: 'What are the advantages of Unity\'s new UI Toolkit compared to the traditional uGUI system? Worth migrating?' },
      { title: 'Addressables system - performance tips?', content: 'Just started using Addressables for asset management. Any performance gotchas I should know about?' },
      { title: 'Best Unity multiplayer solution for turn-based games?', content: 'Building a turn-based strategy game. Photon, Mirror, or Netcode for GameObjects?' },
      { title: 'Input System package - worth the learning curve?', content: 'Still using the old input manager. Is the new Input System worth switching to?' },
      { title: 'Unity 2023 LTS vs 2024 Tech Stream?', content: 'Starting a new project. Should I go with the stable LTS or use the latest features?' },
      { title: 'Scriptable Objects for game architecture?', content: 'Heard a lot about using Scriptable Objects for modular design. Best practices?' },
      { title: 'Unity DOTS - ready for production?', content: 'Is DOTS (ECS) mature enough for a commercial project in 2024?' },
      { title: 'Cinemachine tips for third-person camera?', content: 'Working on a third-person adventure game. Cinemachine camera setup recommendations?' },
      { title: 'ProBuilder vs Blender for level blocking?', content: 'For rapid prototyping, should I use ProBuilder in Unity or block out in Blender?' },
      { title: 'Unity ML-Agents for game AI?', content: 'Anyone using ML-Agents for NPC behavior instead of traditional AI? Worth it?' },
      { title: 'Timeline for cutscenes - performance impact?', content: 'Concerned about Timeline performance in mobile games. Should I use it?' },
      { title: 'Best asset for procedural generation?', content: 'Looking for recommendations on procedural generation assets for dungeon/level creation' },
    ],
    Unreal: [
      { title: 'UE5 Nanite performance on mid-range PCs?', content: 'How well does Nanite perform on GTX 1060 level hardware? Worth using for my project?' },
      { title: 'Blueprint vs C++ for gameplay programming?', content: 'Starting with Unreal. Should I learn Blueprints first or dive straight into C++?' },
      { title: 'Lumen vs traditional lighting workflow?', content: 'Lumen looks amazing but impacts performance. When should I stick with baked lighting?' },
      { title: 'MetaHuman Creator - customization limits?', content: 'How much can you customize MetaHumans? Can I create stylized characters?' },
      { title: 'Best practices for Sequencer cinematics?', content: 'Making in-game cinematics with Sequencer. Tips for smooth playback and transitions?' },
      { title: 'Enhanced Input system migration guide?', content: 'Migrating from old input to Enhanced Input. Any migration gotchas?' },
      { title: 'GAS (Gameplay Ability System) for beginners?', content: 'Is GAS too complex for a solo developer? Alternatives for ability systems?' },
      { title: 'UE5 World Partition for open world games?', content: 'Building an open-world game. World Partition best practices?' },
      { title: 'Chaos physics vs PhysX?', content: 'Should I enable Chaos for vehicle physics or stick with PhysX?' },
      { title: 'Best Unreal marketplace assets for environments?', content: 'Looking for high-quality environment assets. Recommendations?' },
    ],
    Godot: [
      { title: 'Godot 4 vs Godot 3 - worth upgrading?', content: 'Currently on Godot 3.5. Is Godot 4 stable enough for production?' },
      { title: 'GDScript vs C# in Godot 4?', content: 'Which language should I choose for a large project in Godot 4?' },
      { title: 'Godot for 3D - competitive with Unity/Unreal?', content: 'How does Godot 4\'s 3D capabilities compare to Unity and Unreal now?' },
      { title: 'Best Godot plugin for state machines?', content: 'Looking for a good state machine addon for complex AI behavior' },
      { title: 'Godot multiplayer with Nakama?', content: 'Anyone using Nakama for Godot multiplayer? How\'s the integration?' },
      { title: 'Godot signals vs direct function calls?', content: 'When should I use signals vs direct method calls? Performance impact?' },
      { title: 'Godot shader tutorials for beginners?', content: 'Want to learn Godot\'s shader language. Best resources?' },
      { title: 'Exporting to mobile - optimization tips?', content: 'First mobile game in Godot. What are the key optimization strategies?' },
      { title: 'Godot asset library recommendations?', content: 'What are the must-have addons from the asset library?' },
    ],
    General: [
      { title: 'Best game engine for solo developers in 2024?', content: 'Starting my first solo game project. Unity, Unreal, or Godot?' },
      { title: 'How long to learn game development from scratch?', content: 'No programming experience. Realistic timeline to make a simple game?' },
      { title: 'Portfolio projects that get you hired?', content: 'What kind of projects should I include in my gamedev portfolio?' },
      { title: 'Game jams - worth it for beginners?', content: 'Never done a game jam. Should beginners participate or wait?' },
      { title: 'Math requirements for game programming?', content: 'How much math do I need to know? Linear algebra? Calculus?' },
      { title: 'Best laptop for game development 2024?', content: 'Budget $1500. Laptop recommendations for Unity/Unreal development?' },
      { title: 'Source control for solo gamedev?', content: 'Git, Perforce, or Plastic SCM for a solo project?' },
      { title: 'Marketing your first indie game?', content: 'Finished my game. Where do I even start with marketing?' },
      { title: 'When to quit your day job for gamedev?', content: 'Indie developers - when did you go full-time? How much savings?' },
      { title: 'Best game design books?', content: 'Looking for recommendations on game design theory and principles' },
      { title: 'Pixel art tools for beginners?', content: 'Want to create pixel art for my game. Aseprite vs Pyxel Edit?' },
      { title: 'Sound effects resources for indie devs?', content: 'Where do you get your SFX? Free or paid recommendations?' },
    ],
    Help: [
      { title: 'Character controller jittering on slopes', content: 'My character stutters when walking on angled surfaces. How do I fix this?' },
      { title: 'Null reference exception in Start()', content: 'Getting NullReferenceException when accessing component in Start(). Help!' },
      { title: 'Git merge conflict in scene file', content: 'Collaborator and I both edited the same scene. How to resolve?' },
      { title: 'Build size too large for mobile', content: 'Android build is 500MB. How can I reduce the size?' },
      { title: 'AI pathfinding not working around obstacles', content: 'NavMesh agent ignores obstacles. What am I doing wrong?' },
      { title: 'Animations not transitioning smoothly', content: 'Blend tree transitions are janky. Any common causes?' },
      { title: 'Memory leak in game loop', content: 'Memory usage grows continuously during play. How to track down?' },
      { title: 'UI scaling issues on different resolutions', content: 'UI looks great on 1920x1080 but breaks on other resolutions' },
    ]
  }

  // Generate 50+ forum posts across categories
  console.log('\n  Generating forum posts...')
  let forumPostCount = 0
  const allForumPosts: any[] = []

  for (const [category, templates] of Object.entries(forumPostTemplates)) {
    for (const template of templates) {
      const author = [...students, ...instructors][Math.floor(Math.random() * (students.length + instructors.length))]
      const createdAt = getRandomPastDate(6)

      const forumPost = await prisma.forumPost.create({
        data: {
          title: template.title,
          content: template.content,
          category,
          authorId: author.id,
          likes: Math.floor(Math.random() * 50),
          views: Math.floor(Math.random() * 300) + 20,
          createdAt,
          tags: {
            create: category === 'Unity'
              ? [{ tag: 'Unity' }, { tag: ['C#', 'Performance', 'Scripting'][Math.floor(Math.random() * 3)] }]
              : category === 'Unreal'
              ? [{ tag: 'Unreal' }, { tag: ['C++', 'Blueprints', 'UE5'][Math.floor(Math.random() * 3)] }]
              : category === 'Godot'
              ? [{ tag: 'Godot' }, { tag: ['GDScript', '2D', '3D'][Math.floor(Math.random() * 3)] }]
              : [{ tag: category }]
          },
        }
      })

      allForumPosts.push(forumPost)
      forumPostCount++

      // Add 1-3 replies to some posts (50% chance)
      if (Math.random() > 0.5) {
        const replyCount = Math.floor(Math.random() * 3) + 1
        for (let r = 0; r < replyCount; r++) {
          const replier = [...students, ...instructors][Math.floor(Math.random() * (students.length + instructors.length))]
          const replyDate = new Date(createdAt)
          replyDate.setHours(replyDate.getHours() + (r + 1) * 2)

          await prisma.reply.create({
            data: {
              content: [
                'Great question! I had the same issue and solved it by...',
                'Check out the official documentation, it has a good example of this',
                'I recommend watching this tutorial series, helped me a lot',
                'This is a common problem, here\'s what worked for me:',
                'Have you tried using a different approach? Maybe...',
              ][Math.floor(Math.random() * 5)],
              authorId: replier.id,
              postId: forumPost.id,
              likes: Math.floor(Math.random() * 15),
              createdAt: replyDate,
            }
          })
        }
      }
    }
  }
  console.log(`  ✓ Created ${forumPostCount} forum posts with replies`)

  // Generate comprehensive course reviews
  console.log('\n  Generating course reviews...')
  let reviewCount = 0
  const reviewTemplates = [
    { rating: 5, comment: 'Absolutely fantastic course! Clear explanations and great projects.' },
    { rating: 5, comment: 'Best course I\'ve taken. The instructor really knows their stuff.' },
    { rating: 5, comment: 'Exceeded my expectations. Worth every penny!' },
    { rating: 4, comment: 'Really good course with solid content. A few sections could be updated.' },
    { rating: 4, comment: 'Great learning experience. Would love more advanced topics.' },
    { rating: 4, comment: 'Well structured and easy to follow. Minor audio issues in some videos.' },
    { rating: 3, comment: 'Decent course but felt rushed in some sections.' },
    { rating: 3, comment: 'Good for beginners but lacks depth for intermediate learners.' },
    { rating: 2, comment: 'Some useful content but not what I expected from the description.' },
  ]

  // Add reviews for random courses from enrolled students
  for (let i = 0; i < 75; i++) {
    const student = students[Math.floor(Math.random() * students.length)]
    const course = allCourses[Math.floor(Math.random() * allCourses.length)]
    const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)]
    const createdAt = getRandomPastDate(5)

    try {
      await prisma.review.create({
        data: {
          rating: template.rating,
          comment: template.comment,
          userId: student.id,
          courseId: course.id,
          createdAt,
        }
      })
      reviewCount++
    } catch (e) {
      // Skip if duplicate review (user already reviewed this course)
      continue
    }
  }
  console.log(`  ✓ Created ${reviewCount} course reviews`)

  // Generate comprehensive progress records
  console.log('\n  Generating progress records...')
  let progressCount = 0

  // For each enrollment, create progress for some lessons
  const allEnrollments = await prisma.enrollment.findMany({
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: true
            }
          }
        }
      }
    }
  })

  for (const enrollment of allEnrollments) {
    const course = enrollment.course
    const allLessons = course.modules.flatMap(m => m.lessons)

    // Create progress for 30-100% of lessons
    const lessonCount = Math.floor(allLessons.length * (Math.random() * 0.7 + 0.3))
    const lessonsToComplete = allLessons.slice(0, lessonCount)

    for (const lesson of lessonsToComplete) {
      const isCompleted = Math.random() > 0.3 // 70% completion rate
      const completionPercentage = isCompleted ? 100 : Math.floor(Math.random() * 80) + 10
      const timeSpent = Math.floor(Math.random() * 45) + 15 // 15-60 minutes

      await prisma.progress.upsert({
        where: {
          userId_courseId_lessonId: {
            userId: enrollment.userId,
            courseId: course.id,
            lessonId: lesson.id
          }
        },
        create: {
          userId: enrollment.userId,
          courseId: course.id,
          lessonId: lesson.id,
          completionPercentage,
          timeSpent,
          completed: isCompleted,
          lastAccessed: getRandomPastDate(4),
        },
        update: {
          completionPercentage,
          timeSpent,
          completed: isCompleted,
          lastAccessed: getRandomPastDate(4),
        }
      })
      progressCount++
    }
  }
  console.log(`  ✓ Created ${progressCount} progress records`)

  // Generate more student portfolios
  console.log('\n  Generating student portfolios...')
  const portfolioStudents = students.slice(2, 10) // Create portfolios for additional students
  let portfolioCount = 0

  const projectTemplates = [
    { title: 'Roguelike Dungeon Crawler', description: 'Procedurally generated dungeon crawler with permadeath mechanics', engine: 'UNITY', tags: ['Roguelike', 'Procedural', '2D'] },
    { title: 'Tower Defense Strategy', description: 'Classic tower defense with unique enemy types and upgrade paths', engine: 'UNITY', tags: ['Strategy', 'TD', 'Mobile'] },
    { title: 'Endless Runner', description: 'High-speed endless runner with obstacle generation and power-ups', engine: 'UNITY', tags: ['Endless', 'Mobile', 'Casual'] },
    { title: 'Puzzle Match-3', description: 'Match-3 puzzle game with special combos and level progression', engine: 'GODOT', tags: ['Puzzle', 'Match-3', 'Casual'] },
    { title: 'Racing Sim', description: 'Realistic racing simulator with multiple tracks and vehicles', engine: 'UNREAL', tags: ['Racing', 'Simulation', '3D'] },
    { title: 'Stealth Action Game', description: 'Top-down stealth game with line-of-sight mechanics', engine: 'GODOT', tags: ['Stealth', 'Action', 'Indie'] },
    { title: 'Bullet Hell Shooter', description: 'Fast-paced bullet hell with boss battles and power-ups', engine: 'UNITY', tags: ['Shooter', 'Bullet Hell', 'Arcade'] },
    { title: 'City Builder', description: 'Isometric city building simulation with resource management', engine: 'UNITY', tags: ['Simulation', 'Strategy', 'Management'] },
    { title: 'Metroidvania Explorer', description: 'Exploration-focused platformer with ability gating', engine: 'GODOT', tags: ['Metroidvania', 'Platformer', 'Exploration'] },
    { title: 'VR Training Sim', description: 'Virtual reality training simulator for industrial applications', engine: 'UNREAL', tags: ['VR', 'Simulation', 'Training'] },
  ]

  for (const student of portfolioStudents) {
    const projectCount = Math.floor(Math.random() * 3) + 2 // 2-4 projects per portfolio
    const selectedProjects = []

    for (let i = 0; i < projectCount; i++) {
      const template = projectTemplates[Math.floor(Math.random() * projectTemplates.length)]
      selectedProjects.push({
        title: template.title,
        description: template.description,
        thumbnail: '/api/placeholder/300/200',
        engine: template.engine,
        webglBuild: Math.random() > 0.5 ? `/games/${template.title.toLowerCase().replace(/\s+/g, '-')}` : null,
        sourceCode: `https://github.com/${student.name.toLowerCase().replace(/\s+/g, '-')}/${template.title.toLowerCase().replace(/\s+/g, '-')}`,
        liveDemo: Math.random() > 0.7 ? `https://itch.io/${student.name.toLowerCase().replace(/\s+/g, '-')}/${template.title.toLowerCase().replace(/\s+/g, '-')}` : null,
        featured: i === 0, // First project is featured
        tags: {
          create: template.tags.map(tag => ({ tag }))
        }
      })
    }

    await prisma.portfolio.create({
      data: {
        title: `${student.name}'s Game Development Portfolio`,
        description: `Showcasing my game development journey and projects`,
        userId: student.id,
        projects: {
          create: selectedProjects
        }
      }
    })
    portfolioCount++
  }
  console.log(`  ✓ Created ${portfolioCount} student portfolios`)

  // Generate additional certifications
  console.log('\n  Generating certifications...')
  let certificationCount = 0
  const certificationTemplates = [
    { course: 'Unity', name: 'Unity Certified Developer', issuer: 'LazyGameDevs Academy' },
    { course: 'Unreal', name: 'Unreal Engine Specialist', issuer: 'LazyGameDevs Academy' },
    { course: 'Godot', name: 'Godot Master Developer', issuer: 'LazyGameDevs Academy' },
    { course: 'Game Design', name: 'Certified Game Designer', issuer: 'LazyGameDevs Academy' },
    { course: 'Mobile', name: 'Mobile Game Development Expert', issuer: 'LazyGameDevs Academy' },
  ]

  // Award certifications to students who have completed courses
  for (let i = 0; i < 15; i++) {
    const student = students[Math.floor(Math.random() * students.length)]
    const template = certificationTemplates[Math.floor(Math.random() * certificationTemplates.length)]
    const credentialId = `LGDV-${template.course.toUpperCase()}-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    try {
      await prisma.certification.create({
        data: {
          name: template.name,
          description: `Successfully completed the comprehensive ${template.course} development course with distinction`,
          issuer: template.issuer,
          credentialId,
          badgeUrl: `/badges/${template.course.toLowerCase()}-completion.svg`,
          verificationUrl: `https://verify.lazygamedevs.com/${credentialId}`,
          userId: student.id,
          issuedAt: getRandomPastDate(4),
        }
      })
      certificationCount++
    } catch (e) {
      // Skip duplicates
      continue
    }
  }
  console.log(`  ✓ Created ${certificationCount} certifications`)

  console.log('\n✅ Community Features Complete:')
  console.log(`   Forum Posts: ${forumPostCount}`)
  console.log(`   Reviews: ${reviewCount}`)
  console.log(`   Progress Records: ${progressCount}`)
  console.log(`   Portfolios: ${portfolioCount}`)
  console.log(`   Certifications: ${certificationCount}`)

  // ==================== Comprehensive Payment and License Key Generation ====================
  console.log('\n💳 Generating comprehensive payment records and license keys...')

  // Helper functions for payment generation
  function generatePaymentId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `dodo_pay_${timestamp}_${random}`
  }

  function generateLicenseKey(engine: string | null, courseTitle: string): string {
    const enginePrefix = engine || 'GEN'
    const coursePrefix = courseTitle.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '')
    const year = new Date().getFullYear()
    const hash = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${enginePrefix}-${coursePrefix}-${year}-${hash}`
  }

  function getRandomPastDate(monthsAgo: number): Date {
    const now = new Date()
    const pastDate = new Date(now)
    pastDate.setMonth(now.getMonth() - Math.floor(Math.random() * monthsAgo))
    pastDate.setDate(Math.floor(Math.random() * 28) + 1)
    pastDate.setHours(Math.floor(Math.random() * 24))
    pastDate.setMinutes(Math.floor(Math.random() * 60))
    return pastDate
  }

  // Payment status distribution (100+ payments)
  const paymentStatusDistribution = [
    { status: 'SUCCEEDED', weight: 0.70, count: 0 },
    { status: 'FAILED', weight: 0.15, count: 0 },
    { status: 'PENDING', weight: 0.10, count: 0 },
    { status: 'CANCELLED', weight: 0.03, count: 0 },
    { status: 'PROCESSING', weight: 0.02, count: 0 }
  ]

  const paymentMethods = [
    { method: 'card', types: ['visa', 'mastercard', 'amex', 'discover'], weight: 0.70 },
    { method: 'paypal', types: ['paypal'], weight: 0.25 },
    { method: 'bank_transfer', types: ['ach', 'wire'], weight: 0.05 }
  ]

  const targetPaymentCount = 120
  const allPayments: any[] = []
  const allLicenseKeys: any[] = []

  // Generate payments for students across various courses
  let paymentCounter = 0
  console.log(`\n  Generating ${targetPaymentCount} payment records...`)

  for (let i = 0; i < targetPaymentCount; i++) {
    // Randomly select student, course, and payment details
    const student = students[Math.floor(Math.random() * students.length)]
    const course = allCourses[Math.floor(Math.random() * allCourses.length)]

    // Determine payment status based on distribution
    const statusRand = Math.random()
    let cumulative = 0
    let paymentStatus: any = 'SUCCEEDED'

    for (const dist of paymentStatusDistribution) {
      cumulative += dist.weight
      if (statusRand <= cumulative) {
        paymentStatus = dist.status
        dist.count++
        break
      }
    }

    // Select payment method
    const methodRand = Math.random()
    let methodCumulative = 0
    let selectedMethod = paymentMethods[0]

    for (const method of paymentMethods) {
      methodCumulative += method.weight
      if (methodRand <= methodCumulative) {
        selectedMethod = method
        break
      }
    }

    const paymentType = selectedMethod.types[Math.floor(Math.random() * selectedMethod.types.length)]
    const last4 = Math.floor(1000 + Math.random() * 9000).toString()

    // Create payment metadata
    const metadata = {
      payment_method: paymentType,
      last4: selectedMethod.method === 'card' ? last4 : undefined,
      email: selectedMethod.method === 'paypal' ? student.email : undefined,
      processor_fee: Math.floor(course.price * 100 * 0.029 + 30), // 2.9% + $0.30
      ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      user_agent: 'Mozilla/5.0',
      ...(paymentStatus === 'FAILED' && {
        failure_code: ['card_declined', 'insufficient_funds', 'expired_card', 'fraud'][Math.floor(Math.random() * 4)],
        failure_message: 'Payment declined by issuer'
      })
    }

    const createdDate = getRandomPastDate(6)
    const completedDate = paymentStatus === 'SUCCEEDED' ? createdDate : null

    const payment = await prisma.payment.create({
      data: {
        dodoPaymentId: generatePaymentId(),
        status: paymentStatus as any,
        amount: Math.floor(course.price * 100), // Convert to cents
        currency: 'USD',
        paymentMethod: selectedMethod.method,
        userId: student.id,
        courseId: course.id,
        createdAt: createdDate,
        completedAt: completedDate,
        metadata: JSON.stringify(metadata),
      }
    })

    allPayments.push(payment)
    paymentCounter++

    // Create license key for successful payments
    if (paymentStatus === 'SUCCEEDED') {
      const licenseKey = generateLicenseKey(course.engine, course.title)
      const activationsLimit = Math.floor(Math.random() * 5) + 1 // 1-5
      const activationsCount = Math.floor(Math.random() * activationsLimit)

      // Determine expiration date (6 months to 2 years)
      const expiresAt = new Date(completedDate!)
      const monthsToAdd = Math.floor(Math.random() * 18) + 6 // 6-24 months
      expiresAt.setMonth(expiresAt.getMonth() + monthsToAdd)

      // Determine license status (80% ACTIVE, 15% EXPIRED, 4% DISABLED, 1% REVOKED)
      let licenseStatus: any = 'ACTIVE'
      const statusRand = Math.random()
      if (statusRand > 0.99) {
        licenseStatus = 'REVOKED'
      } else if (statusRand > 0.95) {
        licenseStatus = 'DISABLED'
      } else if (statusRand > 0.80) {
        licenseStatus = 'EXPIRED'
      }

      const license = await prisma.licenseKey.upsert({
        where: {
          userId_courseId: {
            userId: student.id,
            courseId: course.id
          }
        },
        create: {
          key: licenseKey,
          dodoLicenseKeyId: `dodo_lic_${generatePaymentId().substring(9)}`,
          status: licenseStatus,
          activationsLimit,
          activationsCount,
          expiresAt,
          userId: student.id,
          courseId: course.id,
          paymentId: payment.id,
        },
        update: {
          status: licenseStatus,
          activationsCount,
          expiresAt,
          paymentId: payment.id,
        }
      })

      allLicenseKeys.push(license)

      // Create or update enrollment for successful payments
      await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: student.id,
            courseId: course.id
          }
        },
        create: {
          userId: student.id,
          courseId: course.id,
          status: licenseStatus === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
          enrolledAt: createdDate,
        },
        update: {
          status: licenseStatus === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
        }
      })
    }

    if ((paymentCounter % 20) === 0) {
      console.log(`  ✓ Generated ${paymentCounter}/${targetPaymentCount} payments...`)
    }
  }

  console.log(`\n✅ Payment Generation Complete:`)
  console.log(`   Total Payments: ${allPayments.length}`)
  paymentStatusDistribution.forEach(dist => {
    const percentage = ((dist.count / targetPaymentCount) * 100).toFixed(1)
    console.log(`   ${dist.status}: ${dist.count} (${percentage}%)`)
  })
  console.log(`   License Keys Generated: ${allLicenseKeys.length}`)
  console.log(`   Enrollments Created: ${allLicenseKeys.length}`)

  // Keep backward compatibility references
  const samplePayment1 = allPayments.find(p => p.status === 'SUCCEEDED') || allPayments[0]
  const samplePayment2 = allPayments.find((p, idx) => p.status === 'SUCCEEDED' && idx > 0) || allPayments[1]

  // ==================== Advanced Payment Analytics Scenarios ====================
  console.log('\n📊 Generating advanced payment analytics scenarios...')

  // 1. Refund Records - Create refunds for 10% of successful payments
  const refundablePayments = allPayments.filter(p => p.status === 'SUCCEEDED').slice(0, 12)
  let refundCount = 0

  for (const originalPayment of refundablePayments) {
    const refundAmount = -Math.abs(originalPayment.amount) // Negative amount for refund
    const refundDate = new Date(originalPayment.completedAt!)
    refundDate.setDate(refundDate.getDate() + Math.floor(Math.random() * 30) + 1) // 1-30 days after purchase

    const refundMetadata = {
      refund_type: ['customer_request', 'course_cancelled', 'duplicate_charge', 'unauthorized'][Math.floor(Math.random() * 4)],
      original_payment_id: originalPayment.dodoPaymentId,
      refund_reason: 'Customer requested refund within 30-day guarantee period',
      processor_fee_refunded: false, // Processor fees typically non-refundable
      partial_refund: Math.random() > 0.8, // 20% chance of partial refund
    }

    await prisma.payment.create({
      data: {
        dodoPaymentId: `dodo_rfnd_${generatePaymentId().substring(9)}`,
        status: 'SUCCEEDED',
        amount: refundMetadata.partial_refund ? Math.floor(refundAmount * 0.5) : refundAmount,
        currency: originalPayment.currency,
        paymentMethod: originalPayment.paymentMethod,
        userId: originalPayment.userId,
        courseId: originalPayment.courseId,
        createdAt: refundDate,
        completedAt: refundDate,
        metadata: JSON.stringify(refundMetadata),
      }
    })
    refundCount++
  }
  console.log(`  ✓ Created ${refundCount} refund records`)

  // 2. Payment Plans - Multi-part payments for higher-priced courses
  const expensiveCourses = allCourses.filter(c => c.price > 80).slice(0, 5)
  let paymentPlanCount = 0

  for (const course of expensiveCourses) {
    const student = students[Math.floor(Math.random() * students.length)]
    const totalAmount = Math.floor(course.price * 100)
    const installments = Math.random() > 0.5 ? 3 : 4 // 3 or 4 installment plan
    const installmentAmount = Math.floor(totalAmount / installments)
    const startDate = getRandomPastDate(4)

    for (let i = 0; i < installments; i++) {
      const installmentDate = new Date(startDate)
      installmentDate.setMonth(installmentDate.getMonth() + i)

      const isPaid = i < installments - 1 || Math.random() > 0.3 // Last installment sometimes unpaid
      const installmentMetadata = {
        payment_plan: true,
        installment_number: i + 1,
        total_installments: installments,
        remaining_balance: isPaid ? (installments - i - 1) * installmentAmount : totalAmount - (i * installmentAmount),
        plan_id: `plan_${student.id}_${course.id}`,
        auto_charge: true,
      }

      await prisma.payment.create({
        data: {
          dodoPaymentId: generatePaymentId(),
          status: isPaid ? 'SUCCEEDED' : 'PENDING',
          amount: installmentAmount,
          currency: 'USD',
          paymentMethod: 'card',
          userId: student.id,
          courseId: course.id,
          createdAt: installmentDate,
          completedAt: isPaid ? installmentDate : null,
          metadata: JSON.stringify(installmentMetadata),
        }
      })
    }
    paymentPlanCount++
  }
  console.log(`  ✓ Created ${paymentPlanCount} payment plans (${paymentPlanCount * 3.5} installment payments)`)

  // 3. International Payments with Currency Conversion
  const currencies = [
    { code: 'EUR', rate: 0.92, countries: ['Germany', 'France', 'Spain'] },
    { code: 'GBP', rate: 0.79, countries: ['United Kingdom'] },
    { code: 'CAD', rate: 1.35, countries: ['Canada'] },
    { code: 'AUD', rate: 1.52, countries: ['Australia'] },
    { code: 'JPY', rate: 149.50, countries: ['Japan'] },
  ]
  let internationalPaymentCount = 0

  for (let i = 0; i < 15; i++) {
    const student = students[Math.floor(Math.random() * students.length)]
    const course = allCourses[Math.floor(Math.random() * allCourses.length)]
    const currency = currencies[Math.floor(Math.random() * currencies.length)]
    const amountInCurrency = Math.floor(course.price * 100 * currency.rate)
    const createdDate = getRandomPastDate(5)

    const internationalMetadata = {
      original_currency: currency.code,
      original_amount: amountInCurrency,
      exchange_rate: currency.rate,
      usd_amount: Math.floor(course.price * 100),
      country: currency.countries[Math.floor(Math.random() * currency.countries.length)],
      conversion_fee: Math.floor(course.price * 100 * 0.02), // 2% conversion fee
      payment_method: 'card',
      international: true,
    }

    await prisma.payment.create({
      data: {
        dodoPaymentId: generatePaymentId(),
        status: 'SUCCEEDED',
        amount: Math.floor(course.price * 100),
        currency: 'USD',
        paymentMethod: 'card',
        userId: student.id,
        courseId: course.id,
        createdAt: createdDate,
        completedAt: createdDate,
        metadata: JSON.stringify(internationalMetadata),
      }
    })
    internationalPaymentCount++
  }
  console.log(`  ✓ Created ${internationalPaymentCount} international payments`)

  // 4. Bulk Course Purchases with Group Discounts
  const bulkPurchases = [
    { studentCount: 5, discount: 0.15, name: 'Small Team' },
    { studentCount: 10, discount: 0.25, name: 'Department' },
    { studentCount: 20, discount: 0.35, name: 'Enterprise' },
  ]
  let bulkPurchaseCount = 0

  for (const bulk of bulkPurchases) {
    const course = allCourses[Math.floor(Math.random() * allCourses.length)]
    const primaryStudent = students[Math.floor(Math.random() * students.length)]
    const totalPrice = course.price * bulk.studentCount
    const discountedPrice = totalPrice * (1 - bulk.discount)
    const createdDate = getRandomPastDate(3)

    const bulkMetadata = {
      bulk_purchase: true,
      seat_count: bulk.studentCount,
      price_per_seat: course.price,
      total_before_discount: Math.floor(totalPrice * 100),
      discount_percentage: bulk.discount * 100,
      discount_amount: Math.floor((totalPrice - discountedPrice) * 100),
      organization_name: `${bulk.name} - Test Organization`,
      license_type: 'multi_seat',
      administrator_email: primaryStudent.email,
    }

    await prisma.payment.create({
      data: {
        dodoPaymentId: generatePaymentId(),
        status: 'SUCCEEDED',
        amount: Math.floor(discountedPrice * 100),
        currency: 'USD',
        paymentMethod: 'bank_transfer',
        userId: primaryStudent.id,
        courseId: course.id,
        createdAt: createdDate,
        completedAt: createdDate,
        metadata: JSON.stringify(bulkMetadata),
      }
    })
    bulkPurchaseCount++
  }
  console.log(`  ✓ Created ${bulkPurchaseCount} bulk purchase records`)

  // 5. Chargeback Scenarios
  const chargebackPayments = allPayments.filter(p => p.status === 'SUCCEEDED').slice(0, 5)
  let chargebackCount = 0

  for (const originalPayment of chargebackPayments) {
    const chargebackDate = new Date(originalPayment.completedAt!)
    chargebackDate.setDate(chargebackDate.getDate() + Math.floor(Math.random() * 60) + 30) // 30-90 days later

    const chargebackMetadata = {
      chargeback: true,
      original_payment_id: originalPayment.dodoPaymentId,
      chargeback_reason: ['fraudulent', 'unrecognized', 'duplicate', 'product_not_received'][Math.floor(Math.random() * 4)],
      chargeback_amount: -Math.abs(originalPayment.amount),
      dispute_status: ['under_review', 'lost', 'won'][Math.floor(Math.random() * 3)],
      chargeback_fee: 1500, // $15 chargeback fee in cents
      representment_submitted: Math.random() > 0.5,
    }

    await prisma.payment.create({
      data: {
        dodoPaymentId: `dodo_chbk_${generatePaymentId().substring(9)}`,
        status: 'FAILED',
        amount: -Math.abs(originalPayment.amount),
        currency: originalPayment.currency,
        paymentMethod: originalPayment.paymentMethod,
        userId: originalPayment.userId,
        courseId: originalPayment.courseId,
        createdAt: chargebackDate,
        completedAt: null,
        metadata: JSON.stringify(chargebackMetadata),
      }
    })
    chargebackCount++
  }
  console.log(`  ✓ Created ${chargebackCount} chargeback scenarios`)

  // 6. Enhanced Analytics - Tax, Affiliate, and Promotional Scenarios
  let analyticsPaymentCount = 0
  const promotionalCodes = ['LAUNCH50', 'SUMMER25', 'STUDENT15', 'BLACKFRIDAY40']

  for (let i = 0; i < 20; i++) {
    const student = students[Math.floor(Math.random() * students.length)]
    const course = allCourses[Math.floor(Math.random() * allCourses.length)]
    const basePrice = course.price * 100
    const createdDate = getRandomPastDate(4)

    // Random promotional discount
    const hasPromo = Math.random() > 0.5
    const promoCode = hasPromo ? promotionalCodes[Math.floor(Math.random() * promotionalCodes.length)] : null
    const promoDiscount = hasPromo ? parseInt(promoCode!.match(/\d+/)![0]) / 100 : 0

    // Tax calculation (varies by location)
    const taxRate = Math.random() > 0.7 ? 0.08 : 0 // 30% chance of 8% tax
    const taxAmount = Math.floor(basePrice * taxRate)

    // Affiliate commission (10% of sales)
    const hasAffiliate = Math.random() > 0.6
    const affiliateCommission = hasAffiliate ? Math.floor(basePrice * 0.10) : 0

    const discountedPrice = Math.floor(basePrice * (1 - promoDiscount))
    const finalPrice = discountedPrice + taxAmount

    const analyticsMetadata = {
      base_price: basePrice,
      promotional_code: promoCode,
      discount_amount: Math.floor(basePrice * promoDiscount),
      tax_rate: taxRate,
      tax_amount: taxAmount,
      final_price: finalPrice,
      affiliate_code: hasAffiliate ? `AFF_${Math.random().toString(36).substring(2, 8).toUpperCase()}` : null,
      affiliate_commission: affiliateCommission,
      processor_fee: Math.floor(finalPrice * 0.029 + 30),
      net_revenue: finalPrice - Math.floor(finalPrice * 0.029 + 30) - affiliateCommission,
      utm_source: ['google', 'facebook', 'twitter', 'reddit', 'youtube'][Math.floor(Math.random() * 5)],
      utm_campaign: ['spring_sale', 'influencer', 'retargeting', 'organic'][Math.floor(Math.random() * 4)],
    }

    await prisma.payment.create({
      data: {
        dodoPaymentId: generatePaymentId(),
        status: 'SUCCEEDED',
        amount: finalPrice,
        currency: 'USD',
        paymentMethod: 'card',
        userId: student.id,
        courseId: course.id,
        createdAt: createdDate,
        completedAt: createdDate,
        metadata: JSON.stringify(analyticsMetadata),
      }
    })
    analyticsPaymentCount++
  }
  console.log(`  ✓ Created ${analyticsPaymentCount} payments with enhanced analytics`)

  console.log('\n✅ Advanced Payment Analytics Complete:')
  console.log(`   Refunds: ${refundCount}`)
  console.log(`   Payment Plans: ${paymentPlanCount}`)
  console.log(`   International Payments: ${internationalPaymentCount}`)
  console.log(`   Bulk Purchases: ${bulkPurchaseCount}`)
  console.log(`   Chargebacks: ${chargebackCount}`)
  console.log(`   Analytics-Enhanced: ${analyticsPaymentCount}`)

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
  console.log(`👥 Users: ${adminUsers.length} Admins, ${instructors.length} Instructors, ${students.length} Students`)
  console.log(`📚 Courses: ${allCourses.length} complete courses with modules and lessons`)
  console.log('📝 Enrollments: Multiple active and completed enrollments with progress tracking')
  console.log('💳 Payments: Multiple payment scenarios (successful, failed, refunds, chargebacks, payment plans)')
  console.log('🔑 License Keys: Generated for all successful course purchases')
  console.log('🏆 Certifications: Completion certificates for finished courses')
  console.log('💬 Forum: Posts with replies and engagement')
  console.log('🎨 Portfolios: Student portfolios with showcase projects')
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