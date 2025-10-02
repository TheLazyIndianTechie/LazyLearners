"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Users,
  UserPlus,
  Crown,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MoreVertical,
  Settings,
  VolumeX,
  Hand,
  Share2
} from "lucide-react"
import { Participant, ParticipantPermissions } from "@/lib/types/collaboration"

interface ParticipantsPanelProps {
  participants: Participant[]
  currentUserId: string
  hostId: string
  onInviteUser: (email: string) => void
  onChangePermissions: (participantId: string, permissions: ParticipantPermissions) => void
  onRemoveParticipant: (participantId: string) => void
  onPromoteToCoHost: (participantId: string) => void
  onMuteParticipant: (participantId: string) => void
  canModerate: boolean
}

export function ParticipantsPanel({
  participants,
  currentUserId,
  hostId,
  onInviteUser,
  onChangePermissions,
  onRemoveParticipant,
  onPromoteToCoHost,
  onMuteParticipant,
  canModerate
}: ParticipantsPanelProps) {
  const [inviteEmail, setInviteEmail] = useState("")
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  const handleInvite = () => {
    if (inviteEmail.trim()) {
      onInviteUser(inviteEmail.trim())
      setInviteEmail("")
      setShowInviteDialog(false)
    }
  }

  const getRoleIcon = (participant: Participant) => {
    if (participant.userId === hostId) {
      return <Crown className="w-4 h-4 text-yellow-500" />
    }
    if (participant.role === "co_host") {
      return <Crown className="w-4 h-4 text-blue-500" />
    }
    if (participant.role === "presenter") {
      return <Share2 className="w-4 h-4 text-green-500" />
    }
    return null
  }

  const getRoleBadge = (participant: Participant) => {
    if (participant.userId === hostId) return "Host"
    if (participant.role === "co_host") return "Co-Host"
    if (participant.role === "presenter") return "Presenter"
    if (participant.role === "observer") return "Observer"
    return "Participant"
  }

  const getStatusColor = (status: Participant["status"]) => {
    switch (status) {
      case "joined": return "bg-green-500"
      case "speaking": return "bg-blue-500"
      case "screen_sharing": return "bg-purple-500"
      case "away": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  const renderParticipant = (participant: Participant) => {
    const isCurrentUser = participant.userId === currentUserId
    const isHost = participant.userId === hostId
    const permissions = JSON.parse(participant.permissions as string) as ParticipantPermissions

    return (
      <div
        key={participant.id}
        className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 ${
          isCurrentUser ? "bg-blue-50 dark:bg-blue-900/20" : ""
        }`}
      >
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={participant.user.avatar} />
            <AvatarFallback>
              {participant.user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
            getStatusColor(participant.status)
          }`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {participant.user.name}
              {isCurrentUser && " (You)"}
            </span>
            {getRoleIcon(participant)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {getRoleBadge(participant)}
            </Badge>
            {participant.status === "speaking" && (
              <Badge variant="outline" className="text-xs text-blue-600">
                Speaking
              </Badge>
            )}
            {participant.status === "screen_sharing" && (
              <Badge variant="outline" className="text-xs text-purple-600">
                Sharing
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Audio/Video indicators */}
          {permissions.canSpeak && (
            <div className="w-6 h-6 flex items-center justify-center">
              {participant.status === "speaking" ? (
                <Mic className="w-4 h-4 text-green-500" />
              ) : (
                <MicOff className="w-4 h-4 text-slate-400" />
              )}
            </div>
          )}

          {permissions.canShareScreen && (
            <div className="w-6 h-6 flex items-center justify-center">
              {participant.status === "screen_sharing" ? (
                <Video className="w-4 h-4 text-blue-500" />
              ) : (
                <VideoOff className="w-4 h-4 text-slate-400" />
              )}
            </div>
          )}

          {/* Actions menu */}
          {(canModerate && !isCurrentUser) || (isCurrentUser && !isHost) ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canModerate && !isCurrentUser && (
                  <>
                    <DropdownMenuItem
                      onClick={() => onPromoteToCoHost(participant.id)}
                      disabled={participant.role === "co_host" || isHost}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      {participant.role === "co_host" ? "Already Co-Host" : "Make Co-Host"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onMuteParticipant(participant.id)}
                      disabled={!permissions.canSpeak}
                    >
                      <VolumeX className="w-4 h-4 mr-2" />
                      Mute
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Permissions
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onRemoveParticipant(participant.id)}
                      className="text-red-600"
                      disabled={isHost}
                    >
                      Remove from Session
                    </DropdownMenuItem>
                  </>
                )}
                {isCurrentUser && !isHost && (
                  <DropdownMenuItem>
                    <Hand className="w-4 h-4 mr-2" />
                    Request Permission
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h3 className="font-semibold">Participants</h3>
            <Badge variant="outline">{participants.length}</Badge>
          </div>

          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Participant</DialogTitle>
                <DialogDescription>
                  Send an invitation to join this collaboration session.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  type="email"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick stats */}
        <div className="flex gap-4 text-xs text-slate-500">
          <span>{participants.filter(p => p.status === "joined").length} online</span>
          <span>{participants.filter(p => p.status === "speaking").length} speaking</span>
          <span>{participants.filter(p => p.status === "screen_sharing").length} sharing</span>
        </div>
      </div>

      {/* Participants list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1">
          {participants.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No participants yet</p>
            </div>
          ) : (
            participants
              .sort((a, b) => {
                // Sort by: host first, then co-hosts, then by join time
                if (a.userId === hostId) return -1
                if (b.userId === hostId) return 1
                if (a.role === "co_host" && b.role !== "co_host") return -1
                if (b.role === "co_host" && a.role !== "co_host") return 1
                return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
              })
              .map(renderParticipant)
          )}
        </div>
      </div>

      {/* Session controls (for host/co-hosts) */}
      {canModerate && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Settings className="w-4 h-4" />
              Session Settings
            </Button>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <VolumeX className="w-4 h-4" />
              Mute All
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}