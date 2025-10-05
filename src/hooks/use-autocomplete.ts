import { useState, useEffect, useCallback } from 'react'
import { debounce } from 'lodash'

export interface AutocompleteSuggestion {
  type: 'course' | 'instructor' | 'tag' | 'category'
  value: string
  label: string
  metadata?: any
}

interface UseAutocompleteReturn {
  suggestions: AutocompleteSuggestion[]
  loading: boolean
  error: Error | null
  search: (query: string) => void
  clear: () => void
}

export function useAutocomplete(limit: number = 10): UseAutocompleteReturn {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/courses/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }

      const data = await response.json()
      setSuggestions(data.suggestions || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching autocomplete suggestions:', err)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  // Debounce the search function to avoid too many API calls
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      fetchSuggestions(query)
    }, 300),
    [limit]
  )

  const search = (query: string) => {
    debouncedSearch(query)
  }

  const clear = () => {
    setSuggestions([])
    setError(null)
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  return {
    suggestions,
    loading,
    error,
    search,
    clear
  }
}
