import { useState, useCallback } from 'react'

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

interface Toast extends ToastProps {
  id: string
  timestamp: number
}

let toastCount = 0

// Simple toast implementation for video streaming
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ title, description, variant = 'default', duration = 5000 }: ToastProps) => {
    const id = `toast-${++toastCount}`
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration,
      timestamp: Date.now()
    }

    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)

    // Also log to console for development
    console.log(`[Toast ${variant}] ${title}: ${description}`)

    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return {
    toast,
    dismiss,
    toasts
  }
}

// Named export for compatibility
export const toast = (props: ToastProps) => {
  console.log(`[Toast ${props.variant || 'default'}] ${props.title}: ${props.description}`)
}