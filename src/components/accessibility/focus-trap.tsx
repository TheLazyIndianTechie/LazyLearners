"use client"

import { useEffect, useRef } from "react"

/**
 * Focus Trap Component
 *
 * Traps keyboard focus within a container, essential for modal dialogs.
 * Implements WCAG 2.1 AA requirement for keyboard navigation in modal contexts.
 *
 * Usage:
 * <FocusTrap active={isModalOpen} onEscape={() => closeModal()}>
 *   <div>Modal content</div>
 * </FocusTrap>
 *
 * Features:
 * - Traps Tab and Shift+Tab navigation within container
 * - Handles Escape key to close modal
 * - Returns focus to trigger element when closed
 * - Automatically focuses first focusable element on mount
 *
 * Related: Task 18.7 - Implement focus trap for modals
 */

interface FocusTrapProps {
  children: React.ReactNode
  active?: boolean
  onEscape?: () => void
  restoreFocus?: boolean
  className?: string
}

export function FocusTrap({
  children,
  active = true,
  onEscape,
  restoreFocus = true,
  className = "",
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return

    // Store the element that had focus before the trap activated
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement
    }

    const container = containerRef.current
    if (!container) return

    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ')

      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (el) => {
          // Filter out elements that are hidden or have display: none
          return el.offsetParent !== null && !el.hasAttribute('aria-hidden')
        }
      )
    }

    // Focus first element when trap activates
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault()
        onEscape()
        return
      }

      // Handle Tab navigation
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements()
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]
        const activeElement = document.activeElement as HTMLElement

        // Shift + Tab (backwards)
        if (event.shiftKey) {
          if (activeElement === firstElement || !container.contains(activeElement)) {
            event.preventDefault()
            lastElement.focus()
          }
        }
        // Tab (forwards)
        else {
          if (activeElement === lastElement || !container.contains(activeElement)) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      // Restore focus to the element that had it before
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [active, onEscape, restoreFocus])

  if (!active) {
    return <>{children}</>
  }

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

/**
 * useFocusTrap Hook
 *
 * A hook version for programmatic focus trap management.
 *
 * Usage:
 * const trapRef = useFocusTrap(isActive)
 * return <div ref={trapRef}>...</div>
 */
export function useFocusTrap(active: boolean = true) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active || !ref.current) return

    const container = ref.current
    const previousActiveElement = document.activeElement as HTMLElement

    const getFocusableElements = (): HTMLElement[] => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ')

      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (el) => el.offsetParent !== null && !el.hasAttribute('aria-hidden')
      )
    }

    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements()
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]
        const activeElement = document.activeElement as HTMLElement

        if (event.shiftKey) {
          if (activeElement === firstElement || !container.contains(activeElement)) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (activeElement === lastElement || !container.contains(activeElement)) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousActiveElement) {
        previousActiveElement.focus()
      }
    }
  }, [active])

  return ref
}

/**
 * useFocusReturn Hook
 *
 * Returns focus to a specified element when component unmounts.
 * Useful for modal dialogs that need to return focus to their trigger.
 *
 * Usage:
 * const buttonRef = useRef<HTMLButtonElement>(null)
 * useFocusReturn(buttonRef)
 */
export function useFocusReturn(elementRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    return () => {
      if (elementRef.current) {
        elementRef.current.focus()
      }
    }
  }, [elementRef])
}
