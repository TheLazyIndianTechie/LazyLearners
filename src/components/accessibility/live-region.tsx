"use client"

import { useEffect, useRef } from "react"

/**
 * Live Region Component
 *
 * ARIA live region for announcing dynamic content changes to screen readers.
 * Essential for WCAG 2.1 AA compliance - ensures screen reader users are notified of updates.
 *
 * Usage:
 * <LiveRegion message={statusMessage} politeness="polite" />
 *
 * Props:
 * - message: The text to announce
 * - politeness: "polite" (wait for user pause) or "assertive" (interrupt immediately)
 * - atomic: Whether to read entire region or just changes
 *
 * Related: Task 18.5 - Add live regions for dynamic content
 */

interface LiveRegionProps {
  message: string
  politeness?: "polite" | "assertive" | "off"
  atomic?: boolean
  className?: string
}

export function LiveRegion({
  message,
  politeness = "polite",
  atomic = true,
  className = "",
}: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Ensure region updates are detected by screen readers
    if (regionRef.current && message) {
      // Clear and re-add to trigger announcement
      const content = regionRef.current
      const text = message
      content.textContent = ""
      setTimeout(() => {
        content.textContent = text
      }, 100)
    }
  }, [message])

  return (
    <div
      ref={regionRef}
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  )
}

/**
 * Status Message Component
 *
 * Specialized live region for status messages (success, error, info).
 * Uses appropriate ARIA roles and politeness levels.
 */

interface StatusMessageProps {
  message: string
  type?: "success" | "error" | "info" | "warning"
  onDismiss?: () => void
}

export function StatusMessage({ message, type = "info", onDismiss }: StatusMessageProps) {
  const politeness = type === "error" || type === "warning" ? "assertive" : "polite"
  const role = type === "error" ? "alert" : "status"

  return (
    <>
      {/* Screen reader announcement */}
      <div role={role} aria-live={politeness} aria-atomic="true" className="sr-only">
        {message}
      </div>

      {/* Visual notification - optional */}
      {message && (
        <div
          className={`fixed bottom-4 right-4 z-50 max-w-md rounded-lg border p-4 shadow-lg ${
            type === "error"
              ? "bg-destructive text-destructive-foreground border-destructive"
              : type === "success"
              ? "bg-secondary text-secondary-foreground border-secondary"
              : type === "warning"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground border-border"
          }`}
          role={role}
          aria-live={politeness}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">{message}</p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-foreground/50 hover:text-foreground transition-colors"
                aria-label="Dismiss notification"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Loading Announcement Component
 *
 * Announces loading states to screen readers.
 */

interface LoadingAnnouncementProps {
  isLoading: boolean
  loadingMessage?: string
  completeMessage?: string
}

export function LoadingAnnouncement({
  isLoading,
  loadingMessage = "Loading content",
  completeMessage = "Content loaded",
}: LoadingAnnouncementProps) {
  return (
    <LiveRegion
      message={isLoading ? loadingMessage : completeMessage}
      politeness="polite"
      atomic={true}
    />
  )
}

/**
 * Form Validation Announcement Component
 *
 * Announces form validation errors to screen readers.
 */

interface FormValidationAnnouncementProps {
  errors: string[]
  touched: boolean
}

export function FormValidationAnnouncement({
  errors,
  touched,
}: FormValidationAnnouncementProps) {
  const message = touched && errors.length > 0 ? errors.join(". ") : ""

  return (
    <LiveRegion
      message={message}
      politeness="assertive"
      atomic={true}
    />
  )
}
