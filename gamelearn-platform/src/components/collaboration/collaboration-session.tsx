"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  MessageSquare,
  Users,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Share2,
  Share2Off,
  Settings,
  Phone,
  PhoneOff,
  Maximize2,
  Minimize2
} from "lucide-react"
import { useCollaboration } from "@/hooks/useCollaboration"
import { ChatPanel } from "./chat-panel"
import { ParticipantsPanel } from "./participants-panel"
import {
  CollaborationSession as SessionType,
  Participant,
  ChatMessage,
  ParticipantPermissions
} from "@/lib/types/collaboration"

interface CollaborationSessionProps {
  sessionId: string
  session?: SessionType
  onLeave?: () => void
}

export function CollaborationSession({
  sessionId,
  session,
  onLeave
}: CollaborationSessionProps) {
  const [showChat, setShowChat] = useState(true)
  const [showParticipants, setShowParticipants] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isInVoiceCall, setIsInVoiceCall] = useState(false)

  const collaboration = useCollaboration({
    sessionId,
    onParticipantJoined: (participant) => {
      console.log("Participant joined:", participant.user.name)
    },
    onParticipantLeft: (userId) => {
      console.log("Participant left:", userId)
    },
    onMessageReceived: (message) => {
      console.log("New message:", message.content)
    },
    onCodeChanged: (change) => {
      console.log("Code changed:", change)
    },
    onCursorMoved: (cursor) => {
      console.log("Cursor moved:", cursor)
    },
    onScreenShareStarted: (userId, data) => {
      console.log("Screen share started by:", userId)
    },
    onScreenShareStopped: (userId) => {
      console.log("Screen share stopped by:", userId)
    },
    onVoiceCallStarted: (userId) => {
      console.log("Voice call started by:", userId)
      setIsInVoiceCall(true)
    },
    onVoiceCallEnded: (userId) => {
      console.log("Voice call ended by:", userId)
      setIsInVoiceCall(false)
    },
    onError: (error) => {
      console.error("Collaboration error:", error)
    }
  })

  const handleToggleVideo = () => {
    const newVideoState = !isVideoOn
    setIsVideoOn(newVideoState)

    // Toggle video stream
    collaboration.toggleVideo(newVideoState)

    // Update session state for other participants
    collaboration.updateSessionState({
      videoEnabled: newVideoState
    })
  }

  const handleToggleMute = () => {
    setIsMuted(!isMuted)
    collaboration.toggleMute(!isMuted)
  }

  const handleToggleScreenShare = () => {
    if (isScreenSharing) {
      collaboration.stopScreenShare()
    } else {
      collaboration.startScreenShare("entire_screen", "medium")
    }
    setIsScreenSharing(!isScreenSharing)
  }

  const handleToggleVoiceCall = () => {
    if (isInVoiceCall) {
      collaboration.endVoiceCall()
    } else {
      collaboration.startVoiceCall()
    }
  }

  const handleInviteUser = async (email: string) => {
    try {
      await collaboration.inviteUser(email, sessionId)
      // Show success notification
      console.log(`Invitation sent to ${email}`)
    } catch (error) {
      console.error('Failed to invite user:', error)
    }
    console.log("Inviting user:", email)
  }

  const handleChangePermissions = (participantId: string, permissions: ParticipantPermissions) => {
    collaboration.grantPermission(participantId, permissions)
  }

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await collaboration.removeParticipant(sessionId, participantId)
      console.log(`🚫 Removed participant ${participantId}`)
    } catch (error) {
      console.error('Failed to remove participant:', error)
    }
  }

  const handlePromoteToCoHost = async (participantId: string) => {
    try {
      const newPermissions: ParticipantPermissions = {
        canEdit: true,
        canModerate: true,
        canInvite: true,
        canRemove: true,
        canManageFiles: true,
        canUseVoice: true,
        canUseVideo: true,
        canShareScreen: true
      }

      await collaboration.grantPermission(participantId, newPermissions)
      console.log(`👑 Promoted participant ${participantId} to co-host`)
    } catch (error) {
      console.error('Failed to promote participant:', error)
    }
  }

  const handleMuteParticipant = async (participantId: string) => {
    try {
      // Send mute command to the participant
      await collaboration.muteParticipant(participantId)

      // Update participant permissions to disable voice
      const participant = collaboration.participants.find(p => p.id === participantId)
      if (participant) {
        const updatedPermissions = {
          ...JSON.parse(participant.permissions as string),
          canUseVoice: false
        }
        await collaboration.grantPermission(participantId, updatedPermissions)
      }

      console.log(`🔇 Muted participant ${participantId}`)
    } catch (error) {
      console.error('Failed to mute participant:', error)
    }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      // Add reaction to the message
      await collaboration.addMessageReaction(messageId, emoji)

      // Update local message state with the new reaction
      const message = collaboration.messages.find(m => m.id === messageId)
      if (message) {
        if (!message.reactions) {
          message.reactions = []
        }

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(
          r => r.emoji === emoji && r.userId === currentUser?.userId
        )

        if (!existingReaction) {
          message.reactions.push({
            emoji,
            userId: currentUser?.userId || '',
            timestamp: new Date()
          })
        }
      }

      console.log(`😀 Added reaction ${emoji} to message ${messageId}`)
    } catch (error) {
      console.error('Failed to add reaction:', error)
    }
  }

  const currentUser = collaboration.currentUser
  const canModerate = currentUser?.permissions ?
    JSON.parse(currentUser.permissions as string).canModerate : false

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold">
              {session?.title || "Collaboration Session"}
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Badge
                variant={collaboration.isConnected ? "default" : "destructive"}
                className="text-xs"
              >
                {collaboration.isConnected ? "Connected" : "Disconnected"}
              </Badge>
              <span>•</span>
              <span>{collaboration.participants.length} participants</span>
              {session?.type && (
                <>
                  <span>•</span>
                  <span className="capitalize">{session.type.replace('_', ' ')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice call controls */}
          <Button
            variant={isInVoiceCall ? "default" : "outline"}
            size="sm"
            onClick={handleToggleVoiceCall}
            className="gap-2"
          >
            {isInVoiceCall ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            {isInVoiceCall ? "Leave Call" : "Start Call"}
          </Button>

          {/* Audio controls */}
          {isInVoiceCall && (
            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="sm"
              onClick={handleToggleMute}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          )}

          {/* Video controls */}
          {isInVoiceCall && (
            <Button
              variant={isVideoOn ? "default" : "outline"}
              size="sm"
              onClick={handleToggleVideo}
            >
              {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </Button>
          )}

          {/* Screen share */}
          <Button
            variant={isScreenSharing ? "default" : "outline"}
            size="sm"
            onClick={handleToggleScreenShare}
          >
            {isScreenSharing ? <Share2Off className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          </Button>

          {/* Panel toggles */}
          <div className="flex border border-slate-300 dark:border-slate-600 rounded-md overflow-hidden">
            <Button
              variant={showChat ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className="rounded-none border-0"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button
              variant={showParticipants ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowParticipants(!showParticipants)}
              className="rounded-none border-0 border-l border-slate-300 dark:border-slate-600"
            >
              <Users className="w-4 h-4" />
            </Button>
          </div>

          {/* Fullscreen toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          {/* Settings */}
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>

          {/* Leave session */}
          {onLeave && (
            <Button variant="destructive" size="sm" onClick={onLeave}>
              Leave
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          {/* Main work area */}
          <ResizablePanel defaultSize={showChat || showParticipants ? 60 : 100}>
            <div className="h-full bg-white dark:bg-slate-800 flex items-center justify-center">
              {/* Screen share or main content area */}
              {collaboration.screenShare?.isActive ? (
                <div className="text-center">
                  <div className="text-4xl mb-4">📺</div>
                  <h3 className="text-lg font-semibold mb-2">Screen Share Active</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {collaboration.screenShare.userId === currentUser?.userId
                      ? "You are sharing your screen"
                      : `${collaboration.participants.find(p => p.userId === collaboration.screenShare?.userId)?.user.name} is sharing their screen`
                    }
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-4">🚀</div>
                  <h3 className="text-lg font-semibold mb-2">Ready to Collaborate</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Start by sharing your screen or opening the code editor
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleToggleScreenShare} className="gap-2">
                      <Share2 className="w-4 h-4" />
                      Share Screen
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Settings className="w-4 h-4" />
                      Open Editor
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>

          {/* Right sidebar */}
          {(showChat || showParticipants) && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={40} minSize={20} maxSize={50}>
                <ResizablePanelGroup direction="vertical">
                  {/* Chat panel */}
                  {showChat && (
                    <ResizablePanel defaultSize={showParticipants ? 60 : 100}>
                      <ChatPanel
                        messages={collaboration.messages}
                        participants={collaboration.participants}
                        currentUserId={currentUser?.userId || ""}
                        onSendMessage={collaboration.sendChatMessage}
                        onReaction={handleReaction}
                        isConnected={collaboration.isConnected}
                      />
                    </ResizablePanel>
                  )}

                  {/* Participants panel */}
                  {showChat && showParticipants && <ResizableHandle />}
                  {showParticipants && (
                    <ResizablePanel defaultSize={showChat ? 40 : 100}>
                      <ParticipantsPanel
                        participants={collaboration.participants}
                        currentUserId={currentUser?.userId || ""}
                        hostId={session?.hostId || ""}
                        onInviteUser={handleInviteUser}
                        onChangePermissions={handleChangePermissions}
                        onRemoveParticipant={handleRemoveParticipant}
                        onPromoteToCoHost={handlePromoteToCoHost}
                        onMuteParticipant={handleMuteParticipant}
                        canModerate={canModerate}
                      />
                    </ResizablePanel>
                  )}
                </ResizablePanelGroup>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Voice call overlay */}
      {isInVoiceCall && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Voice call active</span>
            <span>•</span>
            <span>{collaboration.voiceCall?.participants.length || 0} participants</span>
          </div>
        </div>
      )}
    </div>
  )
}