"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Send,
  Smile,
  Code,
  Image as ImageIcon,
  MoreVertical,
  Reply,
  Heart,
  ThumbsUp,
  Clock
} from "lucide-react"
import { ChatMessage, Participant } from "@/lib/types/collaboration"
import { formatDistanceToNow } from "date-fns"

interface ChatPanelProps {
  messages: ChatMessage[]
  participants: Participant[]
  currentUserId: string
  onSendMessage: (content: string, type?: "text" | "code", replyToId?: string) => void
  onReaction: (messageId: string, emoji: string) => void
  isConnected: boolean
}

const commonEmojis = ["👍", "❤️", "😄", "😮", "😢", "😡", "🎉", "🔥"]

export function ChatPanel({
  messages,
  participants,
  currentUserId,
  onSendMessage,
  onReaction,
  isConnected
}: ChatPanelProps) {
  const [messageInput, setMessageInput] = useState("")
  const [messageType, setMessageType] = useState<"text" | "code">("text")
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!messageInput.trim() || !isConnected) return

    onSendMessage(messageInput, messageType, replyingTo?.id)
    setMessageInput("")
    setReplyingTo(null)
    setMessageType("text")
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message)
    inputRef.current?.focus()
  }

  const handleReaction = (messageId: string, emoji: string) => {
    onReaction(messageId, emoji)
    setShowEmojiPicker(null)
  }

  const getParticipantName = (userId: string) => {
    const participant = participants.find(p => p.userId === userId)
    return participant?.user.name || "Unknown User"
  }

  const getParticipantAvatar = (userId: string) => {
    const participant = participants.find(p => p.userId === userId)
    return participant?.user.avatar
  }

  const formatMessageTime = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = message.userId === currentUserId
    const replyToMessage = message.replyToId
      ? messages.find(m => m.id === message.replyToId)
      : null

    return (
      <div
        key={message.id}
        className={`flex gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 ${
          isOwnMessage ? "bg-blue-50 dark:bg-blue-900/20" : ""
        }`}
      >
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={getParticipantAvatar(message.userId)} />
          <AvatarFallback>
            {getParticipantName(message.userId).charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {getParticipantName(message.userId)}
            </span>
            {message.type === "code" && (
              <Badge variant="outline" className="text-xs">
                <Code className="w-3 h-3 mr-1" />
                Code
              </Badge>
            )}
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatMessageTime(message.createdAt)}
            </span>
            {message.isEdited && (
              <span className="text-xs text-slate-400">(edited)</span>
            )}
          </div>

          {replyToMessage && (
            <div className="mb-2 p-2 bg-slate-100 dark:bg-slate-700 rounded border-l-2 border-slate-300 dark:border-slate-500">
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                Replying to {getParticipantName(replyToMessage.userId)}
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 truncate">
                {replyToMessage.content}
              </div>
            </div>
          )}

          <div className="mb-2">
            {message.type === "code" ? (
              <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-sm overflow-x-auto">
                <code>{message.content}</code>
              </pre>
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>

          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 space-y-1">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm">{attachment.filename}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex gap-1">
                {Object.entries(
                  message.reactions.reduce((acc, reaction) => {
                    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                ).map(([emoji, count]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(message.id, emoji)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-200 dark:bg-slate-600 rounded-full hover:bg-slate-300 dark:hover:bg-slate-500"
                  >
                    <span>{emoji}</span>
                    <span>{count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Message actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReply(message)}
                className="h-6 w-6 p-0"
              >
                <Reply className="w-3 h-3" />
              </Button>

              <DropdownMenu
                open={showEmojiPicker === message.id}
                onOpenChange={(open) => setShowEmojiPicker(open ? message.id : null)}
              >
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Smile className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-auto p-2">
                  <div className="grid grid-cols-4 gap-1">
                    {commonEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(message.id, emoji)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleReply(message)}>
                    Reply
                  </DropdownMenuItem>
                  {isOwnMessage && (
                    <>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Chat</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`} />
            <span className="text-xs text-slate-500">
              {participants.length} participant{participants.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-0">
        <div className="space-y-0">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <div className="text-4xl mb-2">💬</div>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Reply preview */}
      {replyingTo && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                Replying to {getParticipantName(replyingTo.userId)}
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 truncate">
                {replyingTo.content}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
              className="h-6 w-6 p-0 ml-2"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant={messageType === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => setMessageType("text")}
          >
            Text
          </Button>
          <Button
            variant={messageType === "code" ? "default" : "outline"}
            size="sm"
            onClick={() => setMessageType("code")}
          >
            <Code className="w-4 h-4 mr-1" />
            Code
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              messageType === "code"
                ? "Enter code snippet..."
                : "Type a message..."
            }
            disabled={!isConnected}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || !isConnected}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {!isConnected && (
          <p className="text-xs text-red-500 mt-1">
            Disconnected. Trying to reconnect...
          </p>
        )}
      </div>
    </div>
  )
}