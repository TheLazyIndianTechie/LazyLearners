"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Keyboard } from "lucide-react"
import { Badge } from "@/components/ui/badge"

/**
 * Keyboard Shortcuts Guide
 *
 * Displays available keyboard shortcuts for the platform.
 * Essential for WCAG 2.1 AA compliance - helps keyboard users discover navigation options.
 *
 * Usage: <KeyboardShortcutsDialog />
 *
 * Related: Task 18.3 - Add keyboard navigation support
 */

interface Shortcut {
  keys: string[]
  description: string
  context?: string
}

const shortcuts: Record<string, Shortcut[]> = {
  "Global Navigation": [
    {
      keys: ["Tab"],
      description: "Navigate to next interactive element",
    },
    {
      keys: ["Shift", "Tab"],
      description: "Navigate to previous interactive element",
    },
    {
      keys: ["Enter"],
      description: "Activate focused button or link",
    },
    {
      keys: ["Space"],
      description: "Activate focused button or toggle checkbox",
    },
    {
      keys: ["Esc"],
      description: "Close modal or dialog",
    },
    {
      keys: ["1"],
      description: "Skip to main content",
      context: "When on skip link",
    },
  ],
  "Video Player": [
    {
      keys: ["Space", "K"],
      description: "Play/Pause video",
    },
    {
      keys: ["F"],
      description: "Toggle fullscreen",
    },
    {
      keys: ["M"],
      description: "Toggle mute",
    },
    {
      keys: ["C"],
      description: "Toggle captions",
    },
    {
      keys: ["P"],
      description: "Toggle picture-in-picture",
    },
    {
      keys: ["←"],
      description: "Rewind 5 seconds",
    },
    {
      keys: ["→"],
      description: "Forward 5 seconds",
    },
    {
      keys: ["J"],
      description: "Rewind 10 seconds",
    },
    {
      keys: ["L"],
      description: "Forward 10 seconds",
    },
    {
      keys: ["↑"],
      description: "Increase volume",
    },
    {
      keys: ["↓"],
      description: "Decrease volume",
    },
    {
      keys: ["0-9"],
      description: "Jump to 0%-90% of video",
    },
    {
      keys: [",", "<"],
      description: "Decrease playback speed",
    },
    {
      keys: [".", ">"],
      description: "Increase playback speed",
    },
  ],
  "Forms": [
    {
      keys: ["Tab"],
      description: "Move to next form field",
    },
    {
      keys: ["Shift", "Tab"],
      description: "Move to previous form field",
    },
    {
      keys: ["Enter"],
      description: "Submit form (when on submit button)",
    },
    {
      keys: ["Space"],
      description: "Toggle checkbox or radio button",
    },
    {
      keys: ["↑", "↓"],
      description: "Navigate select options",
    },
  ],
}

export function KeyboardShortcutsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label="View keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" aria-hidden="true" />
          Keyboard Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Navigate the platform efficiently using these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(shortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3">{category}</h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{shortcut.description}</p>
                      {shortcut.context && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {shortcut.context}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs px-2 py-1 min-w-[2rem] justify-center"
                          >
                            {key}
                          </Badge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Most interactive elements can be focused using the{" "}
            <Badge variant="outline" className="font-mono text-xs mx-1">Tab</Badge> key and
            activated with <Badge variant="outline" className="font-mono text-xs mx-1">Enter</Badge> or{" "}
            <Badge variant="outline" className="font-mono text-xs mx-1">Space</Badge>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Keyboard Shortcuts Hook
 *
 * Provides programmatic access to keyboard shortcuts.
 * Useful for displaying context-specific shortcuts.
 */
export function useKeyboardShortcuts() {
  return shortcuts
}
