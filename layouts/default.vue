<script setup lang="ts">
import Toast from 'primevue/toast'

import { useIncomingCall } from '~/composables/stream/useIncomingCall'

const streamStore = useStreamStore()
const authStore = useAuthStore()
const config = useRuntimeConfig()

const apiKey = config.public.streamApiKey
const token = computed(() => streamStore.getStreamToken)
const user = computed(() => streamStore.getStreamUser)

const { incomingCall, handleAcceptCall, handleDeclineCall } = useIncomingCall(
  apiKey,
  token.value as string,
  user.value as { id: string }
)

// Initialize video client when user is authenticated
watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      streamStore.initVideoClient()
    } else {
      streamStore.disconnect()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (authStore.isAuthenticated) {
    streamStore.initVideoClient()
  }
})

onBeforeUnmount(() => {
  streamStore.disconnect()
})
</script>

<template>
  <div class="h-full">
    <Toast />
    <SharedIncomingCallPopup
      v-if="incomingCall"
      :incoming-call="incomingCall"
      @accept-call="handleAcceptCall"
      @decline-call="handleDeclineCall"
    />
    <main class="h-full">
      <slot />
    </main>
    <SharedFooter />
  </div>
</template>
