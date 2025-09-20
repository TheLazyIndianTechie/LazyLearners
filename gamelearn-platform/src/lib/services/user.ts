import { User, Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import {
  BaseService,
  ServiceConfig,
  ValidationError,
  ConflictError,
  NotFoundError,
  ServiceResult,
  createSuccessResult,
  createErrorResult
} from "./base"

// User DTOs (Data Transfer Objects)
export interface CreateUserDTO {
  name: string
  email: string
  password: string
  role?: Role
}

export interface UpdateUserDTO {
  name?: string
  email?: string
  password?: string
  role?: Role
  isActive?: boolean
}

export interface UserFilterDTO {
  role?: Role
  isActive?: boolean
  search?: string
  page?: number
  limit?: number
}

export interface PublicUser {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  usersByRole: Record<Role, number>
  recentRegistrations: number
}

class UserService extends BaseService {
  constructor(config: ServiceConfig = {}) {
    super('UserService', config)
  }

  // Create a new user
  async createUser(userData: CreateUserDTO): Promise<ServiceResult<PublicUser>> {
    return this.timeOperation('createUser', async () => {
      try {
        // Validate input
        this.validateRequired(userData.name, 'name')
        this.validateRequired(userData.email, 'email')
        this.validateRequired(userData.password, 'password')
        this.validateEmail(userData.email)

        if (userData.password.length < 8) {
          throw new ValidationError('Password must be at least 8 characters long')
        }

        // Check if user already exists
        const existingUser = await this.dbOperation(
          'SELECT',
          'user',
          () => prisma.user.findUnique({
            where: { email: userData.email.toLowerCase() }
          })
        )

        if (existingUser) {
          throw new ConflictError('User already exists with this email')
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 12)

        // Create user
        const user = await this.dbOperation(
          'CREATE',
          'user',
          () => prisma.user.create({
            data: {
              name: userData.name.trim(),
              email: userData.email.toLowerCase().trim(),
              password: hashedPassword,
              role: userData.role || 'STUDENT',
              isActive: true
            }
          })
        )

        // Log business event
        this.logBusinessEvent('user_created', {
          userId: user.id,
          email: userData.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          role: user.role
        })

        // Remove password from response
        const { password: _, ...publicUser } = user

        // Invalidate user-related caches
        await this.invalidateCache(`${this.serviceName}:stats:*`)
        await this.invalidateCache(`${this.serviceName}:list:*`)

        return createSuccessResult(publicUser as PublicUser)
      } catch (error) {
        if (error instanceof ValidationError || error instanceof ConflictError) {
          return createErrorResult(error)
        }

        this.logger.error('Failed to create user', error as Error, {
          email: userData.email.replace(/(.{2}).*(@.*)/, '$1***$2')
        })

        throw error
      }
    })
  }

  // Get user by ID
  async getUserById(userId: string): Promise<ServiceResult<PublicUser | null>> {
    return this.timeOperation('getUserById', async () => {
      try {
        this.validateUUID(userId, 'User ID')

        // Try cache first
        const cacheKey = this.getCacheKey('user', userId)
        let user = await this.getFromCache<PublicUser>(cacheKey)

        if (!user) {
          const dbUser = await this.dbOperation(
            'SELECT',
            'user',
            () => prisma.user.findUnique({
              where: { id: userId }
            })
          )

          if (dbUser) {
            const { password: _, ...publicUser } = dbUser
            user = publicUser as PublicUser

            // Cache the result
            await this.setCache(cacheKey, user)
          }
        }

        return createSuccessResult(user)
      } catch (error) {
        if (error instanceof ValidationError) {
          return createErrorResult(error)
        }

        this.logger.error('Failed to get user by ID', error as Error, { userId })
        throw error
      }
    })
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<ServiceResult<PublicUser | null>> {
    return this.timeOperation('getUserByEmail', async () => {
      try {
        this.validateRequired(email, 'email')
        this.validateEmail(email)

        const normalizedEmail = email.toLowerCase().trim()

        // Try cache first
        const cacheKey = this.getCacheKey('user_email', normalizedEmail)
        let user = await this.getFromCache<PublicUser>(cacheKey)

        if (!user) {
          const dbUser = await this.dbOperation(
            'SELECT',
            'user',
            () => prisma.user.findUnique({
              where: { email: normalizedEmail }
            })
          )

          if (dbUser) {
            const { password: _, ...publicUser } = dbUser
            user = publicUser as PublicUser

            // Cache the result
            await this.setCache(cacheKey, user, 600) // 10 minutes for email lookups
          }
        }

        return createSuccessResult(user)
      } catch (error) {
        if (error instanceof ValidationError) {
          return createErrorResult(error)
        }

        this.logger.error('Failed to get user by email', error as Error, {
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
        })
        throw error
      }
    })
  }

  // Update user
  async updateUser(userId: string, updateData: UpdateUserDTO): Promise<ServiceResult<PublicUser>> {
    return this.timeOperation('updateUser', async () => {
      try {
        this.validateUUID(userId, 'User ID')

        // Check if user exists
        const existingUser = await this.dbOperation(
          'SELECT',
          'user',
          () => prisma.user.findUnique({
            where: { id: userId }
          })
        )

        if (!existingUser) {
          throw new NotFoundError('User', userId)
        }

        // Validate email if provided
        if (updateData.email) {
          this.validateEmail(updateData.email)

          // Check if email is already taken by another user
          const emailTaken = await this.dbOperation(
            'SELECT',
            'user',
            () => prisma.user.findFirst({
              where: {
                email: updateData.email!.toLowerCase().trim(),
                id: { not: userId }
              }
            })
          )

          if (emailTaken) {
            throw new ConflictError('Email is already taken by another user')
          }
        }

        // Prepare update data
        const updatePayload: any = {}

        if (updateData.name !== undefined) {
          updatePayload.name = updateData.name.trim()
        }

        if (updateData.email !== undefined) {
          updatePayload.email = updateData.email.toLowerCase().trim()
        }

        if (updateData.password !== undefined) {
          if (updateData.password.length < 8) {
            throw new ValidationError('Password must be at least 8 characters long')
          }
          updatePayload.password = await bcrypt.hash(updateData.password, 12)
        }

        if (updateData.role !== undefined) {
          updatePayload.role = updateData.role
        }

        if (updateData.isActive !== undefined) {
          updatePayload.isActive = updateData.isActive
        }

        // Update user
        const updatedUser = await this.dbOperation(
          'UPDATE',
          'user',
          () => prisma.user.update({
            where: { id: userId },
            data: updatePayload
          })
        )

        // Log business event
        this.logBusinessEvent('user_updated', {
          userId,
          updatedFields: Object.keys(updatePayload)
        })

        // Remove password from response
        const { password: _, ...publicUser } = updatedUser

        // Invalidate caches
        await this.invalidateCache(`${this.serviceName}:user:${userId}`)
        if (updateData.email) {
          await this.invalidateCache(`${this.serviceName}:user_email:*`)
        }
        await this.invalidateCache(`${this.serviceName}:list:*`)
        await this.invalidateCache(`${this.serviceName}:stats:*`)

        return createSuccessResult(publicUser as PublicUser)
      } catch (error) {
        if (error instanceof ValidationError || error instanceof ConflictError || error instanceof NotFoundError) {
          return createErrorResult(error)
        }

        this.logger.error('Failed to update user', error as Error, { userId })
        throw error
      }
    })
  }

  // Delete user (soft delete)
  async deleteUser(userId: string): Promise<ServiceResult<void>> {
    return this.timeOperation('deleteUser', async () => {
      try {
        this.validateUUID(userId, 'User ID')

        // Check if user exists
        const user = await this.dbOperation(
          'SELECT',
          'user',
          () => prisma.user.findUnique({
            where: { id: userId }
          })
        )

        if (!user) {
          throw new NotFoundError('User', userId)
        }

        // Soft delete by deactivating
        await this.dbOperation(
          'UPDATE',
          'user',
          () => prisma.user.update({
            where: { id: userId },
            data: { isActive: false }
          })
        )

        // Log business event
        this.logBusinessEvent('user_deleted', {
          userId,
          email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2')
        })

        // Invalidate caches
        await this.invalidateCache(`${this.serviceName}:user:${userId}`)
        await this.invalidateCache(`${this.serviceName}:user_email:${user.email}`)
        await this.invalidateCache(`${this.serviceName}:list:*`)
        await this.invalidateCache(`${this.serviceName}:stats:*`)

        return createSuccessResult(undefined)
      } catch (error) {
        if (error instanceof ValidationError || error instanceof NotFoundError) {
          return createErrorResult(error)
        }

        this.logger.error('Failed to delete user', error as Error, { userId })
        throw error
      }
    })
  }

  // List users with filtering and pagination
  async listUsers(filter: UserFilterDTO = {}): Promise<ServiceResult<{
    items: PublicUser[]
    pagination: {
      total: number
      page: number
      limit: number
      pages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }>> {
    return this.timeOperation('listUsers', async () => {
      try {
        const page = filter.page || 1
        const limit = filter.limit || 20
        const { skip, take } = this.validatePagination(page, limit)

        // Build cache key
        const cacheKey = this.getCacheKey('list', JSON.stringify(filter))

        // Try cache first
        let result = await this.getFromCache<any>(cacheKey)

        if (!result) {
          // Build where clause
          const where: any = {}

          if (filter.role) {
            where.role = filter.role
          }

          if (filter.isActive !== undefined) {
            where.isActive = filter.isActive
          }

          if (filter.search) {
            where.OR = [
              { name: { contains: filter.search, mode: 'insensitive' } },
              { email: { contains: filter.search, mode: 'insensitive' } }
            ]
          }

          // Get total count and users in parallel
          const [total, users] = await Promise.all([
            this.dbOperation('COUNT', 'user', () =>
              prisma.user.count({ where })
            ),
            this.dbOperation('SELECT', 'user', () =>
              prisma.user.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  isActive: true,
                  createdAt: true,
                  updatedAt: true
                }
              })
            )
          ])

          result = this.formatListResponse(users, total, page, limit)

          // Cache the result
          await this.setCache(cacheKey, result, 60) // 1 minute for list results
        }

        return createSuccessResult(result)
      } catch (error) {
        if (error instanceof ValidationError) {
          return createErrorResult(error)
        }

        this.logger.error('Failed to list users', error as Error, { filter })
        throw error
      }
    })
  }

  // Get user statistics
  async getUserStats(): Promise<ServiceResult<UserStats>> {
    return this.timeOperation('getUserStats', async () => {
      try {
        const cacheKey = this.getCacheKey('stats', 'all')

        // Try cache first
        let stats = await this.getFromCache<UserStats>(cacheKey)

        if (!stats) {
          // Get stats from database
          const [
            totalUsers,
            activeUsers,
            studentCount,
            instructorCount,
            adminCount,
            recentRegistrations
          ] = await Promise.all([
            this.dbOperation('COUNT', 'user', () =>
              prisma.user.count()
            ),
            this.dbOperation('COUNT', 'user', () =>
              prisma.user.count({ where: { isActive: true } })
            ),
            this.dbOperation('COUNT', 'user', () =>
              prisma.user.count({ where: { role: 'STUDENT' } })
            ),
            this.dbOperation('COUNT', 'user', () =>
              prisma.user.count({ where: { role: 'INSTRUCTOR' } })
            ),
            this.dbOperation('COUNT', 'user', () =>
              prisma.user.count({ where: { role: 'ADMIN' } })
            ),
            this.dbOperation('COUNT', 'user', () =>
              prisma.user.count({
                where: {
                  createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                  }
                }
              })
            )
          ])

          stats = {
            totalUsers,
            activeUsers,
            usersByRole: {
              STUDENT: studentCount,
              INSTRUCTOR: instructorCount,
              ADMIN: adminCount
            },
            recentRegistrations
          }

          // Cache the result
          await this.setCache(cacheKey, stats, 300) // 5 minutes for stats
        }

        return createSuccessResult(stats)
      } catch (error) {
        this.logger.error('Failed to get user stats', error as Error)
        throw error
      }
    })
  }

  // Verify user password (for login)
  async verifyPassword(email: string, password: string): Promise<ServiceResult<PublicUser | null>> {
    return this.timeOperation('verifyPassword', async () => {
      try {
        this.validateRequired(email, 'email')
        this.validateRequired(password, 'password')
        this.validateEmail(email)

        const user = await this.dbOperation(
          'SELECT',
          'user',
          () => prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
          })
        )

        if (!user || !user.isActive) {
          // Log security event for failed login attempt
          this.logSecurityEvent('login_attempt_failed', 'medium', {
            email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
            reason: user ? 'inactive_account' : 'user_not_found'
          })

          return createSuccessResult(null)
        }

        const isValidPassword = await bcrypt.compare(password, user.password)

        if (!isValidPassword) {
          // Log security event for failed password
          this.logSecurityEvent('login_attempt_failed', 'medium', {
            email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
            reason: 'invalid_password'
          })

          return createSuccessResult(null)
        }

        // Log successful login
        this.logBusinessEvent('user_login', {
          userId: user.id,
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
        })

        // Remove password from response
        const { password: _, ...publicUser } = user

        return createSuccessResult(publicUser as PublicUser)
      } catch (error) {
        if (error instanceof ValidationError) {
          return createErrorResult(error)
        }

        this.logger.error('Failed to verify password', error as Error, {
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
        })
        throw error
      }
    })
  }
}

// Export singleton instance
export const userService = new UserService()