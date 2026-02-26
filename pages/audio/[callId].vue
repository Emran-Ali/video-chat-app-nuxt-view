<script setup lang="ts">
import type { PreJoinDeviceSettings } from '@/types/stream/pre-join.type'
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const streamStore = useStreamStore()
const route = useRoute()

const callId = route.params.callId

const callType = 'audio_room'

const streamUser = computed(() => streamStore.getStreamUser)

const readyToJoin = ref(false)
const settings = ref<PreJoinDeviceSettings>({})

const handleJoinCall = (preJoinDeviceSettings: PreJoinDeviceSettings) => {
  settings.value.isCameraOn = preJoinDeviceSettings.isCameraOn
  settings.value.isMicrophoneOn = preJoinDeviceSettings.isMicrophoneOn
  settings.value.selectedCameraId = preJoinDeviceSettings.selectedCameraId
  settings.value.selectedMicrophoneId =
    preJoinDeviceSettings.selectedMicrophoneId
  settings.value.selectedSpeakerId = preJoinDeviceSettings.selectedSpeakerId

  readyToJoin.value = true
}

onMounted(() => {
  if (!callId) {
    navigateTo('/')
  }
})
</script>

<template>
  <!-- TODO: Need to implement audio call UI -->
  <StreamVideoChat
    v-if="readyToJoin"
    :stream-user="streamUser"
    :settings="settings"
    :call-id="callId as string"
    :call-type="callType as string"
  />
</template>
