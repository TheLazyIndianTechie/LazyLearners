import { NextRequest } from "next/server"
import { WebSocketServer } from "ws"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  WebSocketMessage,
  WebSocketEventType,
  CollaborationEvent
} from "@/lib/types/collaboration"
import {
  joinCollaborationSession,
  leaveCollaborationSession,
  sendChatMessage,
  logCollaborationEvent,
  updateParticipantPermissions
} from "@/lib/collaboration"

interface ExtendedWebSocket extends WebSocket {
  userId?: string
  sessionId?: string
  isAlive?: boolean
}

class CollaborationWebSocketServer {
  private wss: WebSocketServer
  private clients: Map<string, ExtendedWebSocket[]> = new Map()
  private heartbeatInterval: NodeJS.Timeout

  constructor() {
    this.wss = new WebSocketServer({ port: 8080 })
    this.setupEventHandlers()
    this.startHeartbeat()
  }

  private setupEventHandlers() {
    this.wss.on("connection", (ws: ExtendedWebSocket, request) => {
      ws.isAlive = true

      ws.on("pong", () => {
        ws.isAlive = true
      })

      ws.on("message", async (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString())
          await this.handleMessage(ws, message)
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
          this.sendError(ws, "Invalid message format")
        }
      })

      ws.on("close", () => {
        this.handleDisconnection(ws)
      })

      ws.on("error", (error) => {
        console.error("WebSocket error:", error)
      })
    })
  }

  private async handleMessage(ws: ExtendedWebSocket, message: WebSocketMessage) {
    const { type, sessionId, userId, data } = message

    // Authenticate user for first message
    if (!ws.userId && type !== "join_session") {
      this.sendError(ws, "Must join session first")
      return
    }

    switch (type) {
      case "join_session":
        await this.handleJoinSession(ws, sessionId, userId, data)
        break

      case "leave_session":
        await this.handleLeaveSession(ws, sessionId, userId)
        break

      case "send_message":
        await this.handleSendMessage(ws, sessionId, userId, data)
        break

      case "code_change":
        await this.handleCodeChange(ws, sessionId, userId, data)
        break

      case "cursor_move":
        await this.handleCursorMove(ws, sessionId, userId, data)
        break

      case "start_screen_share":
        await this.handleStartScreenShare(ws, sessionId, userId, data)
        break

      case "stop_screen_share":
        await this.handleStopScreenShare(ws, sessionId, userId)
        break

      case "start_voice_call":
        await this.handleStartVoiceCall(ws, sessionId, userId)
        break

      case "end_voice_call":
        await this.handleEndVoiceCall(ws, sessionId, userId)
        break

      case "mute_audio":
      case "unmute_audio":
        await this.handleAudioToggle(ws, sessionId, userId, type === "mute_audio")
        break

      case "request_permission":
        await this.handlePermissionRequest(ws, sessionId, userId, data)
        break

      case "grant_permission":
      case "revoke_permission":
        await this.handlePermissionChange(ws, sessionId, userId, data, type === "grant_permission")
        break

      case "lock_file":
      case "unlock_file":
        await this.handleFileLock(ws, sessionId, userId, data, type === "lock_file")
        break

      case "upload_file":
        await this.handleFileUpload(ws, sessionId, userId, data)
        break

      default:
        this.sendError(ws, "Unknown message type")
    }
  }

  private async handleJoinSession(
    ws: ExtendedWebSocket,
    sessionId: string,
    userId: string,
    data: any
  ) {
    try {
      // Verify session access
      const participant = await joinCollaborationSession(sessionId, userId, data.role || "participant")

      if (!participant) {
        this.sendError(ws, "Unable to join session")
        return
      }

      ws.userId = userId
      ws.sessionId = sessionId

      // Add to clients map
      if (!this.clients.has(sessionId)) {
        this.clients.set(sessionId, [])
      }
      this.clients.get(sessionId)!.push(ws)

      // Notify others in session
      this.broadcastToSession(sessionId, {
        type: "user_joined",
        sessionId,
        userId,
        data: { participant },
        timestamp: new Date()
      }, [userId])

      // Send current session state to new participant
      this.sendToClient(ws, {
        type: "session_joined",
        sessionId,
        userId,
        data: {
          participant,
          message: "Successfully joined session"
        },
        timestamp: new Date()
      })

      // Log the event
      await logCollaborationEvent(sessionId, userId, "user_joined", { role: data.role })

    } catch (error) {
      console.error("Error handling join session:", error)
      this.sendError(ws, "Failed to join session")
    }
  }

  private async handleLeaveSession(ws: ExtendedWebSocket, sessionId: string, userId: string) {
    try {
      await leaveCollaborationSession(sessionId, userId)
      this.removeFromSession(ws, sessionId, userId)

      // Notify others
      this.broadcastToSession(sessionId, {
        type: "user_left",
        sessionId,
        userId,
        data: {},
        timestamp: new Date()
      }, [userId])

      await logCollaborationEvent(sessionId, userId, "user_left", {})

    } catch (error) {
      console.error("Error handling leave session:", error)
    }
  }

  private async handleSendMessage(
    ws: ExtendedWebSocket,
    sessionId: string,
    userId: string,
    data: any
  ) {
    try {
      const message = await sendChatMessage(
        sessionId,
        userId,
        data.content,
        data.type || "text",
        data.replyToId
      )

      if (message) {
        this.broadcastToSession(sessionId, {
          type: "message_sent",
          sessionId,
          userId,
          data: { message },
          timestamp: new Date()
        })

        await logCollaborationEvent(sessionId, userId, "message_sent", {
          messageId: message.id,
          type: data.type
        })
      }

    } catch (error) {
      console.error("Error handling send message:", error)
      this.sendError(ws, "Failed to send message")
    }
  }

  private async handleCodeChange(
    ws: ExtendedWebSocket,
    sessionId: string,
    userId: string,
    data: any
  ) {
    try {
      // Broadcast code change to all participants
      this.broadcastToSession(sessionId, {
        type: "code_changed",
        sessionId,
        userId,
        data: {
          fileId: data.fileId,
          operation: data.operation,
          position: data.position,
          content: data.content,
          revision: data.revision
        },
        timestamp: new Date()
      }, [userId])

      await logCollaborationEvent(sessionId, userId, "code_changed", {
        fileId: data.fileId,
        operation: data.operation
      })

    } catch (error) {
      console.error("Error handling code change:", error)
    }
  }

  private async handleCursorMove(
    ws: ExtendedWebSocket,
    sessionId: string,
    userId: string,
    data: any
  ) {
    // Broadcast cursor position to other participants
    this.broadcastToSession(sessionId, {
      type: "cursor_moved",
      sessionId,
      userId,
      data: {
        fileId: data.fileId,
        line: data.line,
        column: data.column,
        selection: data.selection
      },
      timestamp: new Date()
    }, [userId])
  }

  private async handleStartScreenShare(
    ws: ExtendedWebSocket,
    sessionId: string,
    userId: string,
    data: any
  ) {
    try {
      this.broadcastToSession(sessionId, {
        type: "screen_share_started",
        sessionId,
        userId,
        data: {
          type: data.type,
          quality: data.quality
        },
        timestamp: new Date()
      })

      await logCollaborationEvent(sessionId, userId, "screen_share_started", {
        type: data.type,
        quality: data.quality
      })

    } catch (error) {
      console.error("Error handling screen share start:", error)
    }
  }

  private async handleStopScreenShare(
    ws: ExtendedWebSocket,
    sessionId: string,
    userId: string
  ) {
    try {
      this.broadcastToSession(sessionId, {
        type: "screen_share_stopped",
        sessionId,
        userId,
        data: {},
        timestamp: new Date()
      })

      await logCollaborationEvent(sessionId, userId, "screen_share_stopped", {})

    } catch (error) {
      console.error("Error handling screen share stop:", error)
    }
  }

  private async handleStartVoiceCall(
    ws: ExtendedWebSocket,
    sessionId: string,
    userId: string
  ) {
    try {
      this.broadcastToSession(sessionId, {
        type: "voice_call_started",
        sessionId,
        userId,
        data: {},
        timestamp: new Date()
      })

      await logCollaborationEvent(sessionId, userId, "voice_call_started", {})

    } catch (error) {
      console.error("Error handling voice call start:", error)
    }
  }

  private async handleEndVoiceCall(
    ws: ExtendedWebSocket,
    sessionId: string,
    userId: string
  ) {
    try {
      this.broadcastToSession(sessionId, {
        type: "voice_call_ended",
        sessionId,
        userId,
        data: {},
        timestamp: new Date()
      })

      await logCollaborationEvent(sessionId, userId, "voice_call_ended", {})

    } catch (error) {
      console.error("Error handling voice call end:", error)
    }
  }

  private async handleAudioToggle(
    ws: ExtendedWebSocket,
    sessionId: string,
    userId: string,
    isMuted: boolean
  ) {
    this.broadcastToSession(sessionId, {
      type: isMuted ? "audio_muted" : "audio_unmuted",
      sessionId,
      userId,
      data: { isMuted },
      timestamp: new Date()
    }, [userId])
  }

  private async handlePermissionRequest(
    ws: ExtendedWebSocket,
    sessionId: string,
    userId: string,
    data: any
  ) {
    // Send permission request to session host/moderators
    this.broadcastToSession(sessionId, {
      type: "permission_requested",
      sessionId,
      userId,
      data: {
        permission: data.permission,
        reason: data.reason
      },
      timestamp: new Date()
    }, [userId])
  }

  private async handlePermissionChange(
    ws: ExtendedWebSocket,
    sessionId: string,
    userId: string,
    data: any,
    isGranting: boolean
  ) {
    try {
      if (isGranting) {
        // Update permissions in database
        await updateParticipantPermissions(
          sessionId,
          data.participantId,
          data.permissions,
          userId
        )
      }

      this.broadcastToSession(sessionId, {
        type: isGranting ? "permission_granted" : "permission_revoked",
        sessionId,
        userId,
        data: {
          participantId: data.participantId,
          permissions: data.permissions
        },
        timestamp: new Date()
      })

    } catch (error) {
      console.error("Error handling permission change:", error)
    }
  }

  private async handleFileLock(
    ws: ExtendedWebSocket,
    sessionId: string,
    userId: string,
    data: any,
    isLocking: boolean
  ) {
    this.broadcastToSession(sessionId, {
      type: isLocking ? "file_locked" : "file_unlocked",
      sessionId,
      userId,
      data: {
        fileId: data.fileId,
        lockedBy: isLocking ? userId : null
      },
      timestamp: new Date()
    }, [userId])
  }

  private async handleFileUpload(
    ws: ExtendedWebSocket,
    sessionId: string,
    userId: string,
    data: any
  ) {
    try {
      this.broadcastToSession(sessionId, {
        type: "file_uploaded",
        sessionId,
        userId,
        data: {
          fileId: data.fileId,
          filename: data.filename,
          type: data.type
        },
        timestamp: new Date()
      })

      await logCollaborationEvent(sessionId, userId, "file_uploaded", {
        fileId: data.fileId,
        filename: data.filename
      })

    } catch (error) {
      console.error("Error handling file upload:", error)
    }
  }

  private handleDisconnection(ws: ExtendedWebSocket) {
    if (ws.sessionId && ws.userId) {
      this.removeFromSession(ws, ws.sessionId, ws.userId)

      this.broadcastToSession(ws.sessionId, {
        type: "user_disconnected",
        sessionId: ws.sessionId,
        userId: ws.userId,
        data: {},
        timestamp: new Date()
      }, [ws.userId])
    }
  }

  private removeFromSession(ws: ExtendedWebSocket, sessionId: string, userId: string) {
    const sessionClients = this.clients.get(sessionId)
    if (sessionClients) {
      const index = sessionClients.indexOf(ws)
      if (index > -1) {
        sessionClients.splice(index, 1)
      }

      if (sessionClients.length === 0) {
        this.clients.delete(sessionId)
      }
    }
  }

  private broadcastToSession(
    sessionId: string,
    message: WebSocketMessage,
    excludeUsers: string[] = []
  ) {
    const sessionClients = this.clients.get(sessionId)
    if (!sessionClients) return

    const messageStr = JSON.stringify(message)

    sessionClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN &&
          client.userId &&
          !excludeUsers.includes(client.userId)) {
        client.send(messageStr)
      }
    })
  }

  private sendToClient(ws: ExtendedWebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  private sendError(ws: ExtendedWebSocket, error: string) {
    this.sendToClient(ws, {
      type: "error",
      sessionId: ws.sessionId || "",
      userId: ws.userId || "",
      data: { error },
      timestamp: new Date()
    })
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: ExtendedWebSocket) => {
        if (!ws.isAlive) {
          ws.terminate()
          return
        }

        ws.isAlive = false
        ws.ping()
      })
    }, 30000) // 30 seconds
  }

  public close() {
    clearInterval(this.heartbeatInterval)
    this.wss.close()
  }
}

// Initialize WebSocket server
let wsServer: CollaborationWebSocketServer | null = null

export async function GET(request: NextRequest) {
  // This endpoint is used to upgrade HTTP to WebSocket
  // In a real implementation, you'd handle the WebSocket upgrade here
  return new Response("WebSocket endpoint", { status: 200 })
}

// Initialize the WebSocket server when the module loads
if (!wsServer && process.env.NODE_ENV !== 'test') {
  wsServer = new CollaborationWebSocketServer()
}

export { wsServer }