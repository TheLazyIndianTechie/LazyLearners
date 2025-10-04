# Database Management

This directory contains database seeding and management scripts for the LazyGameDevs platform.

## Available Scripts

### Seeding

#### Full Seed (Development)
```bash
npm run db:seed
```
Creates comprehensive sample data:
- 3 Admin users
- 12 Instructors
- 50 Students
- 50+ Courses across all categories
- 263+ Modules with 2000+ Lessons
- 85+ Enrollments with progress tracking
- 193+ Payment records (successful, failed, refunds, chargebacks, payment plans)
- 80+ License keys
- Reviews, portfolios, forum posts, certifications

**Use this for:** Local development, testing, demos

#### Minimal Seed (Production/Staging)
```bash
npm run db:seed:minimal
```
Creates essential data only:
- 1 Admin user
- 1 Instructor
- 3 Students
- 3 Sample courses with basic lessons

**Use this for:** Production, staging, or when you need a clean minimal dataset

### Database Management

#### Reset Database
```bash
npm run db:reset
```
Deletes ALL data from the database while preserving the schema.

⚠️ **Warning:** This is destructive and cannot be undone!

**Safety:** Cannot run in production (NODE_ENV=production). The script will error and exit.

#### Validate Database
```bash
npm run db:validate
```
Validates seed data integrity and relationships:
- User counts and role distribution
- Course structure (modules, lessons)
- Enrollment and progress tracking
- Payment and license key relationships
- Data integrity checks (orphaned records, missing relationships)

**Use this:** After seeding to verify data integrity, or to diagnose issues

#### Refresh Database
```bash
npm run db:refresh
```
Convenience command that runs:
1. `npm run db:reset` - Clear all data
2. `npm run db:seed` - Seed with full dataset

**Use this:** When you want to start fresh with a full dataset

### Prisma Commands

#### Generate Prisma Client
```bash
npx prisma generate
```
Regenerates the Prisma Client after schema changes.

#### Push Schema to Database
```bash
npx prisma db push
```
Pushes schema changes to the database without migrations.

**Use this for:** Development when you want quick schema updates

#### Open Prisma Studio
```bash
npx prisma studio
```
Opens a visual database browser at http://localhost:5555

## File Descriptions

### seed.ts
Full comprehensive seed with:
- 50+ students with diverse profiles (game developers, artists, programmers, designers)
- 12 instructors specialized in different areas
- 50+ courses across 12 categories:
  - Unity Development
  - Unreal Development
  - Godot Development
  - Game Programming (C++, C#, algorithms)
  - Game Design
  - Game Art (3D modeling, animation, VFX)
  - Mobile Games
  - VR/AR Development
  - Indie Development
  - Game Audio
  - Multiplayer/Networking
  - Performance Optimization
- Advanced payment scenarios for analytics
- Realistic user journeys and progress tracking

### seed-minimal.ts
Minimal production-ready seed with just the essentials:
- Single admin for platform management
- Single instructor for content creation
- 3 test students
- 3 basic courses (Unity, Unreal, Game Design)
- Each course has 1 module with 1 video lesson

### seed-course.ts
Legacy simple seed (kept for reference):
- Creates single Unity course example
- Shows basic course structure

## Environment-Specific Seeding

The seed scripts are environment-aware:

**Development:**
```bash
NODE_ENV=development npm run db:seed
```
- Full dataset for testing all features
- Multiple payment scenarios
- Rich user interactions

**Staging:**
```bash
NODE_ENV=staging npm run db:seed:minimal
```
- Minimal data for production-like environment
- Essential users and courses only
- Clean dataset for deployment testing

**Production:**
```bash
NODE_ENV=production npm run db:seed:minimal
```
- Minimal seed recommended
- Reset script will refuse to run (safety measure)

## Login Credentials

After seeding, use these credentials to access the platform:

**Admin:**
- Email: `admin@lazygamedevs.com`
- Password: `demo123`

**Instructor:**
- Email: `john.smith@instructor.com`
- Password: `demo123`

**Student:**
- Email: `student1@example.com`
- Password: `demo123`

All users use the same demo password: `demo123`

## Validation Checks

The `db:validate` script performs these checks:

### ✅ User Validation
- Admin users exist
- Instructors exist
- Students exist
- Role distribution is correct

### ✅ Course Validation
- Courses exist
- Courses are published
- Courses have modules
- Course structure is complete

### ✅ Content Validation
- Modules have lessons
- Lessons belong to modules
- No orphaned content

### ✅ Relationship Validation
- Courses have instructors
- Enrollments have users and courses
- Progress tracking exists

### ✅ Payment Validation
- Payments exist
- License keys generated for successful payments
- Payment status distribution

## Troubleshooting

### Issue: Seed fails with "unique constraint violation"
**Solution:** The database already has data. Run `npm run db:reset` first, then seed again.

### Issue: Validation fails with missing relationships
**Solution:** Run `npm run db:refresh` to reset and re-seed with fresh data.

### Issue: Cannot run reset in production
**Solution:** This is intentional! The reset script refuses to run in production to prevent accidental data loss.

### Issue: TypeScript errors when running scripts
**Solution:** Run `npx prisma generate` to regenerate the Prisma Client after schema changes.

## Best Practices

1. **Development:** Use full seed for comprehensive testing
2. **Staging:** Use minimal seed to match production-like data
3. **Production:** Use minimal seed and only when necessary
4. **Always validate:** Run `npm run db:validate` after seeding
5. **Schema changes:** Run `npx prisma generate` after modifying schema.prisma
6. **Fresh start:** Use `npm run db:refresh` to reset and re-seed in one command

## Database Schema

See `schema.prisma` for the complete database schema including:
- User management (roles, skills, OAuth)
- Course structure (courses, modules, lessons, resources)
- Progress tracking (enrollments, lesson progress, quiz attempts)
- Payments (Dodo integration, license keys)
- Community features (reviews, forums, portfolios)
- Certifications and achievements
