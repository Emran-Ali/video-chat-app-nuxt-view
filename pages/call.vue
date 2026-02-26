<script setup lang="ts">
import type { PreJoinDeviceSettings } from '@/types/stream/pre-join.type'
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const streamStore = useStreamStore()
const route = useRoute()

const callType = route.query.callType

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
  if (!callType) {
    navigateTo('/')
  }
})
</script>

<template>
  <StreamVideoChat
    v-if="readyToJoin"
    :stream-user="streamUser"
    :settings="settings"
    :call-id="`lesson-${lessonId}`"
    :call-type="callType as string"
  />
</template>
