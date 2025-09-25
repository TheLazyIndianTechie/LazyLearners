/**
 * Data migration utility to sync existing database users with Clerk
 * This should be run after setting up Clerk to ensure data consistency
 */

import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/nextjs/server'
import type { ClerkUserRole } from '@/lib/clerk-utils'

interface MigrationResult {
  success: boolean
  message: string
  usersProcessed: number
  errors: string[]
}

export async function migrateUsersToClerk(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    message: '',
    usersProcessed: 0,
    errors: []
  }

  try {
    console.log('Starting user migration to Clerk...')

    // Get all users from database
    const dbUsers = await prisma.user.findMany()
    console.log(`Found ${dbUsers.length} users in database`)

    // Get all users from Clerk
    const clerkUsers = await clerkClient.users.getUserList()
    const clerkUserMap = new Map(clerkUsers.data.map(user => [user.id, user]))

    for (const dbUser of dbUsers) {
      try {
        const clerkUser = clerkUserMap.get(dbUser.id)

        if (clerkUser) {
          // User exists in Clerk - sync metadata
          await clerkClient.users.updateUser(dbUser.id, {
            publicMetadata: {
              ...clerkUser.publicMetadata,
              role: dbUser.role as ClerkUserRole,
              migratedAt: new Date().toISOString()
            },
            privateMetadata: {
              ...clerkUser.privateMetadata,
              dbSynced: true
            }
          })

          console.log(`✓ Synced metadata for user: ${dbUser.email}`)
        } else {
          // User doesn't exist in Clerk - this is expected for users who haven't signed up yet
          console.log(`- User ${dbUser.email} not found in Clerk (not signed up yet)`)
        }

        result.usersProcessed++
      } catch (error) {
        const errorMessage = `Failed to process user ${dbUser.email}: ${error}`
        console.error(errorMessage)
        result.errors.push(errorMessage)
      }
    }

    // Also check for Clerk users not in database
    for (const clerkUser of clerkUsers.data) {
      const dbUser = await prisma.user.findUnique({ where: { id: clerkUser.id } })

      if (!dbUser) {
        // Create database record for Clerk user
        try {
          await prisma.user.create({
            data: {
              id: clerkUser.id,
              email: clerkUser.emailAddresses[0]?.emailAddress || '',
              name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
              image: clerkUser.imageUrl || null,
              role: (clerkUser.publicMetadata?.role as string) || 'STUDENT',
              createdAt: new Date(clerkUser.createdAt),
              updatedAt: new Date(clerkUser.updatedAt)
            }
          })

          console.log(`✓ Created database record for Clerk user: ${clerkUser.emailAddresses[0]?.emailAddress}`)
        } catch (error) {
          const errorMessage = `Failed to create database record for Clerk user ${clerkUser.id}: ${error}`
          console.error(errorMessage)
          result.errors.push(errorMessage)
        }
      }
    }

    if (result.errors.length === 0) {
      result.message = `Successfully processed ${result.usersProcessed} users`
      console.log('✅ Migration completed successfully!')
    } else {
      result.success = false
      result.message = `Completed with ${result.errors.length} errors`
      console.log('⚠️ Migration completed with errors')
    }

  } catch (error) {
    result.success = false
    result.message = `Migration failed: ${error}`
    result.errors.push(String(error))
    console.error('❌ Migration failed:', error)
  }

  return result
}

// API endpoint version of the migration
export async function POST() {
  try {
    const result = await migrateUsersToClerk()

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Migration endpoint failed',
        error: String(error),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}