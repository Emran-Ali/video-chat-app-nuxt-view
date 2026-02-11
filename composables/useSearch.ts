import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from './useQuery'

export interface SearchConfig {
  debounceMs?: number
  minLength?: number
  placeholder?: string
}

/**
 * Composable for handling table search with debouncing and URL query parameters
 *
 * Usage:
 * 1. In your page component: const { searchQuery, updateSearch, clearSearch } = useSearch()
 * 2. Add search input to your table component
 * 3. The search will automatically update URL query params (search=value)
 * 4. Your API calls should include this query param for backend searching
 *
 * Example:
 * ```typescript
 * // In your page component
 * const { searchQuery, updateSearch } = useSearch({ debounceMs: 500 })
 *
 * // In your template
 * <input v-model="searchQuery" @input="updateSearch" placeholder="Search..." />
 *
 * // The query watcher will automatically include search parameter
 * useQueryWatcher((query) => {
 *   // query will include: "search=john&sortBy=name&sortOrder=asc"
 *   myStore.fetchData(query)
 * })
 * ```
 */
export const useSearch = (config: SearchConfig = {}) => {
  const route = useRoute()
  const { updateQuery } = useQuery()

  const { debounceMs = 300, minLength = 1 } = config

  // Get current search value from URL
  const searchQuery = ref<string>((route.query.search as string) || '')

  // Debounce timer
  let debounceTimer: NodeJS.Timeout | null = null

  // Update search in query params with debouncing
  const updateSearch = (value?: string) => {
    const searchValue = value !== undefined ? value : searchQuery.value

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Set new timer
    debounceTimer = setTimeout(() => {
      if (searchValue.length >= minLength || searchValue.length === 0) {
        updateQuery({
          search: searchValue || null,
          page: '1', // Reset to first page when searching
        })
      }
    }, debounceMs)
  }

  // Clear search
  const clearSearch = () => {
    searchQuery.value = ''
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    updateQuery({
      search: null,
      page: '1',
    })
  }

  // Watch for external URL changes (browser back/forward)
  watch(
    () => route.query.search,
    (newSearch) => {
      searchQuery.value = (newSearch as string) || ''
    }
  )

  // Handle input changes
  const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    searchQuery.value = target.value
    updateSearch(target.value)
  }

  // Check if currently searching
  const isSearching = computed(() => {
    return searchQuery.value.length > 0
  })

  // Get search query string for API calls
  const getSearchQuery = () => {
    return searchQuery.value
      ? `search=${encodeURIComponent(searchQuery.value)}`
      : ''
  }

  return {
    searchQuery,
    updateSearch,
    clearSearch,
    handleInput,
    isSearching,
    getSearchQuery,
  }
}
