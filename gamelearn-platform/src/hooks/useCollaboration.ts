"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import {
  WebSocketMessage,
  WebSocketEventType,
  CollaborationSession,
  Participant,
  ChatMessage,
  ParticipantRole
} from "@/lib/types/collaboration"

interface UseCollaborationOptions {
  sessionId: string
  onParticipantJoined?: (participant: Participant) => void
  onParticipantLeft?: (userId: string) => void
  onMessageReceived?: (message: ChatMessage) => void
  onCodeChanged?: (change: any) => void
  onCursorMoved?: (cursor: any) => void
  onScreenShareStarted?: (userId: string, data: any) => void
  onScreenShareStopped?: (userId: string) => void
  onVoiceCallStarted?: (userId: string) => void
  onVoiceCallEnded?: (userId: string) => void
  onPermissionChanged?: (userId: string, permissions: any) => void
  onError?: (error: string) => void
}

interface CollaborationState {
  isConnected: boolean
  isConnecting: boolean
  participants: Participant[]
  messages: ChatMessage[]
  currentUser?: Participant
  screenShare?: {
    userId: string
    isActive: boolean
    type: string
  }
  voiceCall?: {
    isActive: boolean
    participants: string[]
  }
}

export function useCollaboration(options: UseCollaborationOptions) {
  const { data: session } = useSession()
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    isConnecting: false,
    participants: [],
    messages: []
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (!session?.user?.id || wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setState(prev => ({ ...prev, isConnecting: true }))

    try {
      // In a real implementation, you'd connect to your WebSocket server
      // For demo purposes, we'll simulate the connection
      const wsUrl = process.env.NODE_ENV === 'production'
        ? 'wss://your-domain.com/api/collaboration/websocket'
        : 'ws://localhost:8080'

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("WebSocket connected")
        setState(prev => ({ ...prev, isConnected: true, isConnecting: false }))
        reconnectAttempts.current = 0

        // Join the session
        sendMessage({
          type: "join_session",
          sessionId: options.sessionId,
          userId: session.user.id,
          data: { role: "participant" },
          timestamp: new Date()
        })
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleIncomingMessage(message)
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason)
        setState(prev => ({ ...prev, isConnected: false, isConnecting: false }))

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000 // Exponential backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        options.onError?.("WebSocket connection error")
      }

    } catch (error) {
      console.error("Failed to create WebSocket connection:", error)
      setState(prev => ({ ...prev, isConnecting: false }))
      options.onError?.("Failed to connect to collaboration server")
    }
  }, [session?.user?.id, options.sessionId])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected")
      wsRef.current = null
    }

    setState(prev => ({ ...prev, isConnected: false, isConnecting: false }))
  }, [])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn("WebSocket not connected, message not sent:", message)
    }
  }, [])

  const handleIncomingMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case "session_joined":
        setState(prev => ({
          ...prev,
          currentUser: message.data.participant
        }))
        break

      case "user_joined":
        setState(prev => ({
          ...prev,
          participants: [...prev.participants, message.data.participant]
        }))
        options.onParticipantJoined?.(message.data.participant)
        break

      case "user_left":
      case "user_disconnected":
        setState(prev => ({
          ...prev,
          participants: prev.participants.filter(p => p.userId !== message.userId)
        }))
        options.onParticipantLeft?.(message.userId)
        break

      case "message_sent":
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, message.data.message]
        }))
        options.onMessageReceived?.(message.data.message)
        break

      case "code_changed":
        options.onCodeChanged?.(message.data)
        break

      case "cursor_moved":
        options.onCursorMoved?.(message.data)
        break

      case "screen_share_started":
        setState(prev => ({
          ...prev,
          screenShare: {
            userId: message.userId,
            isActive: true,
            type: message.data.type
          }
        }))
        options.onScreenShareStarted?.(message.userId, message.data)
        break

      case "screen_share_stopped":
        setState(prev => ({
          ...prev,
          screenShare: undefined
        }))
        options.onScreenShareStopped?.(message.userId)
        break

      case "voice_call_started":
        setState(prev => ({
          ...prev,
          voiceCall: {
            isActive: true,
            participants: [message.userId]
          }
        }))
        options.onVoiceCallStarted?.(message.userId)
        break

      case "voice_call_ended":
        setState(prev => ({
          ...prev,
          voiceCall: undefined
        }))
        options.onVoiceCallEnded?.(message.userId)
        break

      case "permission_granted":
      case "permission_revoked":
        options.onPermissionChanged?.(message.data.participantId, message.data.permissions)
        break

      case "error":
        options.onError?.(message.data.error)
        break

      default:
        console.log("Unhandled message type:", message.type)
    }
  }, [options])

  // Collaboration actions
  const actions = {
    sendChatMessage: useCallback((content: string, type: "text" | "code" = "text", replyToId?: string) => {
      if (!session?.user?.id) return

      sendMessage({
        type: "send_message",
        sessionId: options.sessionId,
        userId: session.user.id,
        data: { content, type, replyToId },
        timestamp: new Date()
      })
    }, [session?.user?.id, options.sessionId, sendMessage]),

    sendCodeChange: useCallback((change: any) => {
      if (!session?.user?.id) return

      sendMessage({
        type: "code_change",
        sessionId: options.sessionId,
        userId: session.user.id,
        data: change,
        timestamp: new Date()
      })
    }, [session?.user?.id, options.sessionId, sendMessage]),

    moveCursor: useCallback((position: any) => {
      if (!session?.user?.id) return

      sendMessage({
        type: "cursor_move",
        sessionId: options.sessionId,
        userId: session.user.id,
        data: position,
        timestamp: new Date()
      })
    }, [session?.user?.id, options.sessionId, sendMessage]),

    startScreenShare: useCallback((type: string, quality: string = "medium") => {
      if (!session?.user?.id) return

      sendMessage({
        type: "start_screen_share",
        sessionId: options.sessionId,
        userId: session.user.id,
        data: { type, quality },
        timestamp: new Date()
      })
    }, [session?.user?.id, options.sessionId, sendMessage]),

    stopScreenShare: useCallback(() => {
      if (!session?.user?.id) return

      sendMessage({
        type: "stop_screen_share",
        sessionId: options.sessionId,
        userId: session.user.id,
        data: {},
        timestamp: new Date()
      })
    }, [session?.user?.id, options.sessionId, sendMessage]),

    startVoiceCall: useCallback(() => {
      if (!session?.user?.id) return

      sendMessage({
        type: "start_voice_call",
        sessionId: options.sessionId,
        userId: session.user.id,
        data: {},
        timestamp: new Date()
      })
    }, [session?.user?.id, options.sessionId, sendMessage]),

    endVoiceCall: useCallback(() => {
      if (!session?.user?.id) return

      sendMessage({
        type: "end_voice_call",
        sessionId: options.sessionId,
        userId: session.user.id,
        data: {},
        timestamp: new Date()
      })
    }, [session?.user?.id, options.sessionId, sendMessage]),

    toggleMute: useCallback((isMuted: boolean) => {
      if (!session?.user?.id) return

      sendMessage({
        type: isMuted ? "mute_audio" : "unmute_audio",
        sessionId: options.sessionId,
        userId: session.user.id,
        data: { isMuted },
        timestamp: new Date()
      })
    }, [session?.user?.id, options.sessionId, sendMessage]),

    requestPermission: useCallback((permission: string, reason?: string) => {
      if (!session?.user?.id) return

      sendMessage({
        type: "request_permission",
        sessionId: options.sessionId,
        userId: session.user.id,
        data: { permission, reason },
        timestamp: new Date()
      })
    }, [session?.user?.id, options.sessionId, sendMessage]),

    grantPermission: useCallback((participantId: string, permissions: any) => {
      if (!session?.user?.id) return

      sendMessage({
        type: "grant_permission",
        sessionId: options.sessionId,
        userId: session.user.id,
        data: { participantId, permissions },
        timestamp: new Date()
      })
    }, [session?.user?.id, options.sessionId, sendMessage]),

    lockFile: useCallback((fileId: string) => {
      if (!session?.user?.id) return

      sendMessage({
        type: "lock_file",
        sessionId: options.sessionId,
        userId: session.user.id,
        data: { fileId },
        timestamp: new Date()
      })
    }, [session?.user?.id, options.sessionId, sendMessage]),

    unlockFile: useCallback((fileId: string) => {
      if (!session?.user?.id) return

      sendMessage({
        type: "unlock_file",
        sessionId: options.sessionId,
        userId: session.user.id,
        data: { fileId },
        timestamp: new Date()
      })
    }, [session?.user?.id, options.sessionId, sendMessage])
  }

  // Connect when component mounts and session is available
  useEffect(() => {
    if (session?.user?.id) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [session?.user?.id, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      disconnect()
    }
  }, [disconnect])

  return {
    ...state,
    ...actions,
    connect,
    disconnect
  }
}