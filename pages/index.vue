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

const streamUserId = computed(() => user.value?.streamId)

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
      if (!apiKey) {
        throw new Error('Stream API key is missing. Check your .env file.')
      }
      client.value = new StreamChat(apiKey)
    }

    console.log('streamUserId', streamUserId.value)
    console.log('streamToken', streamToken)

    await client.value.connectUser(
      {
        id: streamUserId.value as string,
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
  <div class="h-full">
    <div
      v-if="isConnecting"
      class="flex flex-col items-center justify-center h-full gap-3 text-cyan-400"
    >
      <div
        class="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"
      />
      <span class="text-sm font-medium">Loading chat...</span>
    </div>

    <div v-else-if="error" class="flex items-center justify-center h-full">
      <div
        class="text-red-500 text-center bg-red-50 p-6 rounded-2xl border border-red-200 shadow"
      >
        <i class="pi pi-exclamation-triangle text-2xl mb-2 block" />
        {{ error }}
        <button
          class="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 block mx-auto"
          @click="$router.go(0)"
        >
          Refresh
        </button>
      </div>
    </div>

    <Chat v-else-if="client?.user" :client="client" :user-id="streamUserId" />

    <div v-else class="flex items-center justify-center h-full text-cyan-300">
      Unable to initialize chat
    </div>
  </div>
</template>
