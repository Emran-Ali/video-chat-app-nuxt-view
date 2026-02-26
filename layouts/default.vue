<script setup lang="ts">
import Toast from 'primevue/toast'

const streamStore = useStreamStore()
const authStore = useAuthStore()

// Initialize video client when user is authenticated
watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      streamStore.initVideoClient()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (authStore.isAuthenticated) {
    streamStore.initVideoClient()
  }
})
</script>

<template>
  <div class="h-full">
    <Toast />
    <StreamIncomingCallPopup />
    <main class="h-full">
      <slot />
    </main>
    <SharedFooter />
  </div>
</template>
