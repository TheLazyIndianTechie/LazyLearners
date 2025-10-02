import { PrismaClient } from '@prisma/client'
import { DatabaseMonitor } from '@/lib/monitoring/database'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create monitored Prisma client for enhanced performance tracking
export const prisma = globalForPrisma.prisma ?? DatabaseMonitor.createMonitoredPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Export the database monitor instance for direct access
export { databaseMonitor } from '@/lib/monitoring/database'