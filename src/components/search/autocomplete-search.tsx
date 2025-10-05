"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, Star, Clock, X } from "lucide-react"
import { Course } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AutocompleteSearchProps {
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
}

export function AutocompleteSearch({
  placeholder = "Search courses, instructors, or topics...",
  onSearch,
  className,
}: AutocompleteSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [results, setResults] = useState<Course[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recent-searches")
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch (error) {
        console.error("Failed to load recent searches:", error)
      }
    }
  }, [])

  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300) // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query])

  // Fetch autocomplete results
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.trim().length < 2) {
        setResults([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/courses/search?q=${encodeURIComponent(debouncedQuery)}&limit=8`
        )
        const data = await response.json()

        if (response.ok) {
          setResults(data.courses || [])
          setIsOpen(true)
        }
      } catch (error) {
        console.error("Failed to fetch autocomplete results:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case "Enter":
          e.preventDefault()
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleSelectCourse(results[selectedIndex])
          } else if (query.trim()) {
            handleSearch(query)
          }
          break
        case "Escape":
          setIsOpen(false)
          setSelectedIndex(-1)
          inputRef.current?.blur()
          break
      }
    },
    [isOpen, selectedIndex, results, query]
  )

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        })
      }
    }
  }, [selectedIndex])

  const handleSelectCourse = (course: Course) => {
    saveRecentSearch(query)
    setIsOpen(false)
    setQuery("")
    router.push(`/courses/${course.id}`)
  }

  const handleSearch = (searchQuery: string) => {
    saveRecentSearch(searchQuery)
    setIsOpen(false)
    if (onSearch) {
      onSearch(searchQuery)
    } else {
      router.push(`/courses?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const saveRecentSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return

    const updated = [
      trimmed,
      ...recentSearches.filter((s) => s !== trimmed),
    ].slice(0, 5) // Keep only 5 recent searches

    setRecentSearches(updated)
    localStorage.setItem("recent-searches", JSON.stringify(updated))
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("recent-searches")
  }

  const handleRecentSearchClick = (search: string) => {
    setQuery(search)
    setDebouncedQuery(search)
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-foreground font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length >= 2 || recentSearches.length > 0) {
              setIsOpen(true)
            }
          }}
          className="pl-10 pr-10 h-12"
          autoComplete="off"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        ) : query ? (
          <button
            onClick={() => {
              setQuery("")
              setResults([])
              setIsOpen(false)
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <Card className="absolute z-50 w-full mt-2 max-h-[400px] overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <div ref={resultsRef} className="max-h-[400px] overflow-y-auto">
              {/* Recent Searches */}
              {query.trim().length < 2 && recentSearches.length > 0 && (
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Recent Searches
                    </h4>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(search)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center gap-2"
                      >
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {query.trim().length >= 2 && results.length === 0 && !isLoading && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No courses found for "{query}"
                </div>
              )}

              {results.length > 0 && (
                <div className="py-2">
                  {results.map((course, index) => (
                    <button
                      key={course.id}
                      onClick={() => handleSelectCourse(course)}
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center gap-4",
                        selectedIndex === index && "bg-accent"
                      )}
                    >
                      {course.thumbnail && (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-16 h-10 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">
                          {highlightMatch(course.title, query)}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{course.rating?.toFixed(1) || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{Math.round(course.duration / 60)}h</span>
                          </div>
                          {course.price === 0 ? (
                            <Badge variant="secondary" className="text-xs py-0 h-5">
                              Free
                            </Badge>
                          ) : (
                            <span className="font-medium">${course.price}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
