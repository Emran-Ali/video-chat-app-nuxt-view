<script setup lang="ts">
import type { StreamChat, UserResponse } from 'stream-chat'

// Debounce utility function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

interface Props {
  client: StreamChat
  placeholder?: string
  modelValue?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search for a user...',
  modelValue: null,
})

const emit = defineEmits<{
  'update:modelValue': [userId: string | null]
  'user-selected': [user: UserResponse]
}>()

const authUser = useAuthStore()

// State
const users = ref<UserResponse[]>([])
const searchQuery = ref('')
const isOpen = ref(false)
const isLoading = ref(false)
const selectedUserId = ref<string | null>(props.modelValue)
const selectRef = ref<HTMLElement>()
const { isTeacher } = useAuthStore()

// Methods
const loadUsers = async (searchTerm: string = '') => {
  if (!props.client) return

  // isLoading.value = true
  try {
    const queryFilter: any = {
      banned: false,
    }

    // Build the filter based on user type and search term
    if (searchTerm.trim()) {
      // If there's a search term, use it with $autocomplete
      queryFilter.name = { $autocomplete: searchTerm }
    }

    const response = await props.client.queryUsers(
      queryFilter,
      {
        name: 1,
        last_active: -1,
      },
      {
        limit: 100,
      }
    )

    users.value = response.users
  } catch (error) {
    console.error('Error loading users:', error)
    users.value = []
  } finally {
    isLoading.value = false
  }
}

// Debounced search function
const debouncedLoadUsers = debounce((searchTerm: string) => {
  loadUsers(searchTerm)
}, 500)

const handleInput = () => {
  isOpen.value = true
  debouncedLoadUsers(searchQuery.value)
}

const selectUser = (user: UserResponse) => {
  selectedUserId.value = user.id
  searchQuery.value = user.name || user.id
  isOpen.value = false

  emit('update:modelValue', user.id)
  emit('user-selected', user)
}

const handleClickOutside = (event: MouseEvent) => {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    isOpen.value = false
    if (!selectedUserId.value) {
      searchQuery.value = ''
    }
  }
}

// Lifecycle
onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  await loadUsers()

  if (props.modelValue) {
    const user = users.value.find((u) => u.id === props.modelValue)
    if (user) {
      searchQuery.value = user.name || user.id
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

watch(
  () => props.modelValue,
  (newValue) => {
    selectedUserId.value = newValue
    if (newValue) {
      const user = users.value.find((u) => u.id === newValue)
      if (user) {
        searchQuery.value = user.name || user.id || user.email
      }
    } else {
      searchQuery.value = ''
    }
  }
)
</script>

<template>
  <div class="relative" ref="selectRef">
    <!-- Search Input -->
    <div
      class="inline-flex w-full px-3 py-2 bg-white/8 border border-white/10 rounded-xl focus-within:border-teal-500/60 focus-within:bg-white/10 transition-all overflow-hidden"
      style="background-color: rgba(255, 255, 255, 0.05)"
    >
      <div class="pr-2 flex items-center justify-center text-teal-400/70">
        <i class="pi pi-search text-sm" />
      </div>
      <input
        v-model="searchQuery"
        type="text"
        class="text-white/80 bg-transparent focus:outline-none text-sm w-full placeholder:text-white/25"
        :placeholder="placeholder"
        @input="handleInput"
      />
    </div>

    <!-- Dropdown Options -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen && users.length > 0"
        class="absolute z-50 w-full mt-1 bg-[#1a2f42] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-auto"
      >
        <ul class="py-1">
          <li
            v-for="user in users"
            :key="user.id"
            class="px-3 py-2 hover:bg-teal-500/10 cursor-pointer transition-colors duration-150"
            :class="{
              'bg-teal-500/20': selectedUserId === user.id,
            }"
            @click="selectUser(user)"
          >
            <div class="flex items-center gap-2">
              <!-- User Avatar -->
              <img
                v-if="user.image"
                :src="user.image"
                :alt="user.name || user.id"
                class="w-7 h-7 rounded-full object-cover"
              />
              <div
                v-else
                class="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-xs font-bold"
              >
                {{ (user.name || user.id).charAt(0).toUpperCase() }}
              </div>

              <!-- User Info -->
              <div>
                <div class="text-sm font-medium text-white/80">
                  {{ user.name || user.id }}
                </div>
                <div v-if="user.online" class="text-xs text-teal-400">
                  ● Online
                </div>
                <div v-else class="text-xs text-white/30">○ Offline</div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </Transition>

    <!-- Loading state -->
    <div
      v-if="isOpen && isLoading"
      class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-gray-500 text-center"
    >
      Loading users...
    </div>

    <!-- No results message -->
    <div
      v-if="isOpen && !isLoading && users.length === 0 && searchQuery"
      class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-gray-500 text-center"
    >
      No users found
    </div>
  </div>
</template>
