import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface UseWishlistReturn {
  wishlist: string[] // Array of course IDs
  loading: boolean
  isInWishlist: (courseId: string) => boolean
  addToWishlist: (courseId: string) => Promise<void>
  removeFromWishlist: (courseId: string) => Promise<void>
  toggleWishlist: (courseId: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useWishlist(): UseWishlistReturn {
  const [wishlist, setWishlist] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/wishlist')

      if (response.status === 401) {
        // User not authenticated, clear wishlist
        setWishlist([])
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch wishlist')
      }

      const data = await response.json()
      const courseIds = data.wishlist?.map((item: any) => item.courseId) || []
      setWishlist(courseIds)
    } catch (err) {
      console.error('Error fetching wishlist:', err)
      setWishlist([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  const isInWishlist = useCallback(
    (courseId: string) => {
      return wishlist.includes(courseId)
    },
    [wishlist]
  )

  const addToWishlist = useCallback(
    async (courseId: string) => {
      try {
        // Optimistic update
        setWishlist(prev => [...prev, courseId])

        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ courseId }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to add to wishlist')
        }

        toast.success('Added to wishlist')
      } catch (err) {
        // Revert optimistic update on error
        setWishlist(prev => prev.filter(id => id !== courseId))
        toast.error((err as Error).message || 'Failed to add to wishlist')
        throw err
      }
    },
    []
  )

  const removeFromWishlist = useCallback(
    async (courseId: string) => {
      try {
        // Optimistic update
        setWishlist(prev => prev.filter(id => id !== courseId))

        const response = await fetch(`/api/wishlist/${courseId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to remove from wishlist')
        }

        toast.success('Removed from wishlist')
      } catch (err) {
        // Revert optimistic update on error
        setWishlist(prev => [...prev, courseId])
        toast.error((err as Error).message || 'Failed to remove from wishlist')
        throw err
      }
    },
    []
  )

  const toggleWishlist = useCallback(
    async (courseId: string) => {
      if (isInWishlist(courseId)) {
        await removeFromWishlist(courseId)
      } else {
        await addToWishlist(courseId)
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist]
  )

  return {
    wishlist,
    loading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    refetch: fetchWishlist,
  }
}
