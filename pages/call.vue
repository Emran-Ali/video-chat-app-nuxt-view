<script setup lang="ts">
import type { PreJoinDeviceSettings } from '@/types/stream/pre-join.type'
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const streamStore = useStreamStore()
const route = useRoute()

const callId = route.query.callId as string
const callType = route.query.callType as string

const streamUser = computed(() => streamStore.getStreamUser)

const readyToJoin = ref(false)
const settings = ref<PreJoinDeviceSettings>({
  isCameraOn: callType !== 'audio_room',
  isMicrophoneOn: true,
})

onMounted(() => {
  if (!callId || !callType) {
    navigateTo('/')
    return
  }
  readyToJoin.value = true
})
</script>

<template>
  <StreamVideoChat
    v-if="readyToJoin"
    :stream-user="streamUser"
    :settings="settings"
    :call-id="callId"
    :call-type="callType"
  />
</template>
