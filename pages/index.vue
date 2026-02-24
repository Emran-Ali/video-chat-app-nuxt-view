<script setup lang="ts">
import { StreamChat } from 'stream-chat'
import Chat from '~/components/views/Message/Chat.vue'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const isConnecting = ref(true)
const error = ref('')
const authStore = useAuthStore()
const config = useRuntimeConfig()
const apiKey = config.public.streamApiKey

// Get user details from localStorage
const streamToken = useCookie('_stream_token').value
const user = computed(() => authStore.getUser)

console.log(user.value)

const streamUserId = user.value?.streamId

// Create a single client instance using ref instead of computed
const client = ref<StreamChat | null>(null)

onMounted(async () => {
  try {
    if (client.value?.user) {
      isConnecting.value = false
      return
    }

    if (!streamToken) {
      throw new Error('No stream token found')
    }

    if (!user.value?.streamId) {
      throw new Error('No stream user found')
    }

    if (!client.value) {
      client.value = new StreamChat(apiKey)
    }

    await client.value.connectUser(
      {
        id: streamUserId,
      },
      streamToken
    )
  } catch (err) {
    console.error('Stream Chat connection error:', err)

    if (err?.message?.includes('token is expired')) {
      error.value = 'Session expired. Please refresh the page.'
    } else if (err?.message?.includes('maximum number of connections')) {
      error.value = 'Too many connections. Please refresh the page.'
    } else {
      error.value = 'Failed to connect to chat. Please try again.'
    }
  } finally {
    isConnecting.value = false
  }
})

onUnmounted(() => {
  if (client.value?.user) {
    console.log('Disconnecting Stream Chat client...')
    client.value.disconnectUser()
    client.value = null
  }
})

watch(user, async (newUser, oldUser) => {
  if (newUser?.streamId !== oldUser?.streamId) {
    if (client.value?.user) {
      await client.value.disconnectUser()
    }
    if (newUser?.streamId) {
      isConnecting.value = true
    }
  }
})
</script>

<template>
  <div class="container mx-auto max-w-7xl">
    <div class="w-full md:w-[calc(100%-185px)] py-8 md:px-3">
      <div v-if="isConnecting" class="text-center w-full mx-auto">
        <div class="spinner"></div>
        Loading chat...
      </div>

      <div
        v-else-if="error"
        class="text-red-500 text-center bg-red-50 p-4 rounded-md"
      >
        {{ error }}
        <button
          class="ml-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          @click="$router.go(0)"
        >
          Refresh
        </button>
      </div>

      <Chat v-else-if="client?.user" :client="client" :user-id="streamUserId" />

      <div v-else class="text-center text-gray-500">
        Unable to initialize chat
      </div>
    </div>
  </div>
</template>

<style scoped>
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 8px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
