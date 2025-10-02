import { prisma } from "@/lib/prisma"
import {
  CollaborationSession,
  Participant,
  ParticipantPermissions,
  SessionType,
  SessionStatus,
  ParticipantRole,
  ChatMessage,
  CollaborationEvent,
  SessionInvite,
  CollaborationSettings
} from "./types/collaboration"

// Utility functions
function extractMentionsFromContent(content: string): string[] {
  // Extract @mentions from message content using regex
  const mentionRegex = /@([a-zA-Z0-9_.-]+)/g
  const matches = content.match(mentionRegex)
  return matches ? matches.map(mention => mention.substring(1)) : []
}

// Session Management
export async function createCollaborationSession(
  hostId: string,
  data: {
    title: string
    description?: string
    type: SessionType
    courseId: string
    lessonId?: string
    projectId?: string
    maxParticipants?: number
    isPublic?: boolean
    requiresApproval?: boolean
  }
): Promise<CollaborationSession | null> {
  try {
    const session = await prisma.collaborationSession.create({
      data: {
        hostId,
        title: data.title,
        description: data.description,
        type: data.type,
        courseId: data.courseId,
        lessonId: data.lessonId,
        projectId: data.projectId,
        status: "scheduled",
        maxParticipants: data.maxParticipants || 10,
        currentParticipants: 0,
        isPublic: data.isPublic ?? true,
        requiresApproval: data.requiresApproval ?? false,
        createdAt: new Date()
      }
    })

    return session as CollaborationSession
  } catch (error) {
    console.error("Error creating collaboration session:", error)
    return null
  }
}

export async function joinCollaborationSession(
  sessionId: string,
  userId: string,
  role: ParticipantRole = "participant"
): Promise<Participant | null> {
  try {
    const session = await prisma.collaborationSession.findUnique({
      where: { id: sessionId },
      include: { participants: true }
    })

    if (!session) {
      throw new Error("Session not found")
    }

    if (session.status === "ended" || session.status === "cancelled") {
      throw new Error("Session has ended")
    }

    if (session.currentParticipants >= session.maxParticipants) {
      throw new Error("Session is full")
    }

    // Check if user is already in session
    const existingParticipant = session.participants.find(p => p.userId === userId)
    if (existingParticipant) {
      return existingParticipant as Participant
    }

    const permissions = getDefaultPermissions(role)

    const participant = await prisma.participant.create({
      data: {
        sessionId,
        userId,
        role,
        status: "joined",
        permissions: JSON.stringify(permissions),
        joinedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        }
      }
    })

    // Update session participant count
    await prisma.collaborationSession.update({
      where: { id: sessionId },
      data: {
        currentParticipants: session.currentParticipants + 1,
        status: session.status === "scheduled" ? "waiting" : session.status
      }
    })

    return participant as Participant
  } catch (error) {
    console.error("Error joining collaboration session:", error)
    return null
  }
}

export async function leaveCollaborationSession(
  sessionId: string,
  userId: string
): Promise<boolean> {
  try {
    const participant = await prisma.participant.findFirst({
      where: {
        sessionId,
        userId,
        leftAt: null
      }
    })

    if (!participant) {
      return false
    }

    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        status: "left",
        leftAt: new Date()
      }
    })

    // Update session participant count
    const session = await prisma.collaborationSession.findUnique({
      where: { id: sessionId }
    })

    if (session && session.currentParticipants > 0) {
      await prisma.collaborationSession.update({
        where: { id: sessionId },
        data: {
          currentParticipants: session.currentParticipants - 1
        }
      })
    }

    return true
  } catch (error) {
    console.error("Error leaving collaboration session:", error)
    return false
  }
}

export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
  hostId: string
): Promise<boolean> {
  try {
    const session = await prisma.collaborationSession.findUnique({
      where: { id: sessionId }
    })

    if (!session || session.hostId !== hostId) {
      return false
    }

    const updateData: any = { status }

    if (status === "active" && !session.startedAt) {
      updateData.startedAt = new Date()
    }

    if (status === "ended" && !session.endedAt) {
      updateData.endedAt = new Date()
    }

    await prisma.collaborationSession.update({
      where: { id: sessionId },
      data: updateData
    })

    return true
  } catch (error) {
    console.error("Error updating session status:", error)
    return false
  }
}

// Messaging
export async function sendChatMessage(
  sessionId: string,
  userId: string,
  content: string,
  type: "text" | "code" | "system" = "text",
  replyToId?: string
): Promise<ChatMessage | null> {
  try {
    const message = await prisma.chatMessage.create({
      data: {
        sessionId,
        userId,
        content,
        type,
        replyToId,
        mentions: extractMentionsFromContent(content),
        attachments: [],
        reactions: [],
        isEdited: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return message as ChatMessage
  } catch (error) {
    console.error("Error sending chat message:", error)
    return null
  }
}

export async function getChatMessages(
  sessionId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ChatMessage[]> {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId,
        isDeleted: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit,
      skip: offset
    })

    return messages.reverse() as ChatMessage[]
  } catch (error) {
    console.error("Error fetching chat messages:", error)
    return []
  }
}

// Permissions
export function getDefaultPermissions(role: ParticipantRole): ParticipantPermissions {
  const basePermissions: ParticipantPermissions = {
    canSpeak: false,
    canShareScreen: false,
    canEditCode: false,
    canControlPlayback: false,
    canInviteOthers: false,
    canModerate: false
  }

  switch (role) {
    case "host":
      return {
        canSpeak: true,
        canShareScreen: true,
        canEditCode: true,
        canControlPlayback: true,
        canInviteOthers: true,
        canModerate: true
      }
    case "co_host":
      return {
        canSpeak: true,
        canShareScreen: true,
        canEditCode: true,
        canControlPlayback: true,
        canInviteOthers: true,
        canModerate: true
      }
    case "presenter":
      return {
        canSpeak: true,
        canShareScreen: true,
        canEditCode: true,
        canControlPlayback: false,
        canInviteOthers: false,
        canModerate: false
      }
    case "participant":
      return {
        canSpeak: true,
        canShareScreen: false,
        canEditCode: false,
        canControlPlayback: false,
        canInviteOthers: false,
        canModerate: false
      }
    case "observer":
      return basePermissions
    default:
      return basePermissions
  }
}

export async function updateParticipantPermissions(
  sessionId: string,
  participantId: string,
  permissions: ParticipantPermissions,
  requesterId: string
): Promise<boolean> {
  try {
    // Check if requester has permission to change permissions
    const requester = await prisma.participant.findFirst({
      where: {
        sessionId,
        userId: requesterId,
        leftAt: null
      }
    })

    if (!requester) {
      return false
    }

    const requesterPermissions = JSON.parse(requester.permissions as string) as ParticipantPermissions
    if (!requesterPermissions.canModerate) {
      return false
    }

    await prisma.participant.update({
      where: { id: participantId },
      data: {
        permissions: JSON.stringify(permissions)
      }
    })

    return true
  } catch (error) {
    console.error("Error updating participant permissions:", error)
    return false
  }
}

// Session Discovery
export async function getActiveSessionsForCourse(courseId: string): Promise<CollaborationSession[]> {
  try {
    const sessions = await prisma.collaborationSession.findMany({
      where: {
        courseId,
        status: {
          in: ["waiting", "active"]
        },
        isPublic: true
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        participants: {
          where: {
            leftAt: null
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return sessions as CollaborationSession[]
  } catch (error) {
    console.error("Error fetching active sessions:", error)
    return []
  }
}

export async function getUserActiveSessions(userId: string): Promise<CollaborationSession[]> {
  try {
    const sessions = await prisma.collaborationSession.findMany({
      where: {
        OR: [
          { hostId: userId },
          {
            participants: {
              some: {
                userId,
                leftAt: null
              }
            }
          }
        ],
        status: {
          in: ["waiting", "active", "paused"]
        }
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        participants: {
          where: {
            leftAt: null
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return sessions as CollaborationSession[]
  } catch (error) {
    console.error("Error fetching user active sessions:", error)
    return []
  }
}

// Invitations
export async function createSessionInvite(
  sessionId: string,
  invitedBy: string,
  data: {
    invitedUser?: string
    email?: string
    message?: string
    expiresAt?: Date
  }
): Promise<SessionInvite | null> {
  try {
    const invite = await prisma.sessionInvite.create({
      data: {
        sessionId,
        invitedBy,
        invitedUser: data.invitedUser,
        email: data.email,
        message: data.message,
        inviteCode: generateInviteCode(),
        expiresAt: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isUsed: false,
        createdAt: new Date()
      }
    })

    return invite as SessionInvite
  } catch (error) {
    console.error("Error creating session invite:", error)
    return null
  }
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Event Logging
export async function logCollaborationEvent(
  sessionId: string,
  userId: string,
  type: string,
  data: Record<string, any>
): Promise<void> {
  try {
    await prisma.collaborationEvent.create({
      data: {
        sessionId,
        userId,
        type,
        data: JSON.stringify(data),
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error("Error logging collaboration event:", error)
  }
}

// Operational Transform utilities for real-time editing
export function transformOperation(op1: any, op2: any, priority: "left" | "right"): any {
  // Simple operational transform implementation
  // In a production system, you'd use a more sophisticated library like ShareJS
  if (op1.type === "insert" && op2.type === "insert") {
    if (op1.position <= op2.position) {
      return {
        ...op2,
        position: op2.position + op1.text.length
      }
    }
  }

  if (op1.type === "delete" && op2.type === "insert") {
    if (op1.position < op2.position) {
      return {
        ...op2,
        position: Math.max(op1.position, op2.position - op1.length)
      }
    }
  }

  // Return original operation if no transformation needed
  return op2
}

export function applyOperation(content: string, operation: any): string {
  switch (operation.type) {
    case "insert":
      return content.slice(0, operation.position) +
             operation.text +
             content.slice(operation.position)
    case "delete":
      return content.slice(0, operation.position) +
             content.slice(operation.position + operation.length)
    case "replace":
      return content.slice(0, operation.position) +
             operation.text +
             content.slice(operation.position + operation.oldText.length)
    default:
      return content
  }
}