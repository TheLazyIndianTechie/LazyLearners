export interface CollaborationSession {
  id: string
  courseId: string
  lessonId?: string
  projectId?: string
  hostId: string
  title: string
  description?: string
  type: SessionType
  status: SessionStatus
  maxParticipants: number
  currentParticipants: number
  isPublic: boolean
  requiresApproval: boolean
  createdAt: Date
  startedAt?: Date
  endedAt?: Date
}

export type SessionType =
  | "code_review"
  | "pair_programming"
  | "study_group"
  | "project_discussion"
  | "live_coding"
  | "debugging_session"
  | "game_jam"

export type SessionStatus =
  | "scheduled"
  | "waiting"
  | "active"
  | "paused"
  | "ended"
  | "cancelled"

export interface Participant {
  id: string
  userId: string
  sessionId: string
  role: ParticipantRole
  status: ParticipantStatus
  joinedAt: Date
  leftAt?: Date
  permissions: ParticipantPermissions
  user: {
    id: string
    name: string
    avatar?: string
    role: "STUDENT" | "INSTRUCTOR" | "ADMIN"
  }
}

export type ParticipantRole =
  | "host"
  | "co_host"
  | "presenter"
  | "participant"
  | "observer"

export type ParticipantStatus =
  | "joined"
  | "away"
  | "speaking"
  | "screen_sharing"
  | "left"

export interface ParticipantPermissions {
  canSpeak: boolean
  canShareScreen: boolean
  canEditCode: boolean
  canControlPlayback: boolean
  canInviteOthers: boolean
  canModerate: boolean
}

export interface ChatMessage {
  id: string
  sessionId: string
  userId: string
  content: string
  type: MessageType
  replyToId?: string
  mentions: string[]
  attachments: MessageAttachment[]
  reactions: MessageReaction[]
  isEdited: boolean
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string
    avatar?: string
  }
}

export type MessageType =
  | "text"
  | "code"
  | "file"
  | "image"
  | "system"
  | "announcement"

export interface MessageAttachment {
  id: string
  filename: string
  url: string
  size: number
  mimeType: string
}

export interface MessageReaction {
  id: string
  messageId: string
  userId: string
  emoji: string
  createdAt: Date
}

export interface CodeChange {
  id: string
  sessionId: string
  userId: string
  operation: OperationType
  position: CodePosition
  content: string
  previousContent?: string
  timestamp: Date
  isReverted: boolean
}

export type OperationType =
  | "insert"
  | "delete"
  | "replace"
  | "move"
  | "format"

export interface CodePosition {
  line: number
  column: number
  endLine?: number
  endColumn?: number
}

export interface ScreenShare {
  id: string
  sessionId: string
  userId: string
  type: ScreenShareType
  isActive: boolean
  quality: StreamQuality
  startedAt: Date
  endedAt?: Date
}

export type ScreenShareType =
  | "entire_screen"
  | "application_window"
  | "browser_tab"

export type StreamQuality =
  | "low"
  | "medium"
  | "high"
  | "auto"

export interface VoiceCall {
  id: string
  sessionId: string
  participants: VoiceParticipant[]
  isActive: boolean
  isMuted: boolean
  quality: AudioQuality
  startedAt: Date
  endedAt?: Date
}

export interface VoiceParticipant {
  userId: string
  isMuted: boolean
  isSpeaking: boolean
  volume: number
  joinedAt: Date
}

export type AudioQuality =
  | "low"
  | "standard"
  | "high"

export interface CollaborationEvent {
  id: string
  sessionId: string
  userId: string
  type: EventType
  data: Record<string, any>
  timestamp: Date
}

export type EventType =
  | "user_joined"
  | "user_left"
  | "message_sent"
  | "code_changed"
  | "screen_share_started"
  | "screen_share_stopped"
  | "voice_call_started"
  | "voice_call_ended"
  | "cursor_moved"
  | "file_uploaded"
  | "session_paused"
  | "session_resumed"
  | "permission_changed"

export interface CursorPosition {
  userId: string
  sessionId: string
  fileId?: string
  line: number
  column: number
  selection?: {
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
  }
  timestamp: Date
}

export interface CollaborationFile {
  id: string
  sessionId: string
  name: string
  type: FileType
  content: string
  language?: string
  path: string
  isLocked: boolean
  lockedBy?: string
  lockExpires?: Date
  version: number
  createdAt: Date
  updatedAt: Date
}

export type FileType =
  | "code"
  | "text"
  | "markdown"
  | "config"
  | "asset"

export interface CollaborationSettings {
  allowAnonymousUsers: boolean
  requireApprovalToJoin: boolean
  enableVoiceChat: boolean
  enableScreenShare: boolean
  enableFileSharing: boolean
  maxFileSize: number
  allowedFileTypes: string[]
  sessionTimeout: number
  maxIdleTime: number
  autoSaveInterval: number
  enableRecording: boolean
}

export interface SessionInvite {
  id: string
  sessionId: string
  invitedBy: string
  invitedUser?: string
  inviteCode?: string
  email?: string
  message?: string
  expiresAt: Date
  acceptedAt?: Date
  isUsed: boolean
  createdAt: Date
}

export interface CollaborationStats {
  sessionId: string
  duration: number
  peakParticipants: number
  totalMessages: number
  totalCodeChanges: number
  filesModified: number
  screenShareDuration: number
  voiceCallDuration: number
  participantStats: ParticipantStats[]
}

export interface ParticipantStats {
  userId: string
  duration: number
  messagesSent: number
  codeChanges: number
  timesSpeaking: number
  screenShareTime: number
}

// WebSocket Events
export interface WebSocketMessage {
  type: WebSocketEventType
  sessionId: string
  userId: string
  data: any
  timestamp: Date
}

export type WebSocketEventType =
  | "join_session"
  | "leave_session"
  | "send_message"
  | "code_change"
  | "cursor_move"
  | "start_screen_share"
  | "stop_screen_share"
  | "start_voice_call"
  | "end_voice_call"
  | "mute_audio"
  | "unmute_audio"
  | "request_permission"
  | "grant_permission"
  | "revoke_permission"
  | "lock_file"
  | "unlock_file"
  | "upload_file"
  | "delete_file"
  | "session_update"
  | "error"

// Real-time synchronization
export interface OperationalTransform {
  operation: TextOperation
  authorId: string
  revision: number
}

export interface TextOperation {
  type: "retain" | "insert" | "delete"
  count?: number
  text?: string
}

export interface DocumentState {
  content: string
  revision: number
  operations: OperationalTransform[]
  lastModified: Date
  collaborators: string[]
}