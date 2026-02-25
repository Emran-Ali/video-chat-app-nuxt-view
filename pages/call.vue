<script setup lang="ts">
import type { PreJoinDeviceSettings } from '@/types/stream/pre-join.type'
import PreJoinScreenTeacher from '~/components/stream/PreJoinScreenTeacher.vue'
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const streamStore = useStreamStore()
const route = useRoute()
const lessonId = computed(() => {
  const id = route.query.lessonId
  if (Array.isArray(id)) {
    return id?.[0] ?? ''
  }
  return (id as string) ?? ''
})
const lessonMeetingId = computed(() => {
  const parsed = Number(lessonId.value)
  return Number.isNaN(parsed) ? 0 : parsed
})
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
  if (!lessonId.value || !callType) {
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
  <PreJoinScreenTeacher
    v-else
    :stream-user="streamUser"
    :callId="`lesson-${lessonId}`"
    :lessonMeetingId="lessonMeetingId"
    :callType="callType as string"
    @join-call="handleJoinCall"
  />
</template>
