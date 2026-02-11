<script setup lang="ts">
import { useVideoCall } from '~/composables/stream/useVideoCall'
import type { PreJoinDeviceSettings } from '@/types/stream/pre-join.type'
import { useHostPresenceTracking } from '@/composables/stream/useHostPresenceTracking'
import { useLessonBookStore } from '~/pinia/lesson-store/lesson-book'
import TeacherCard from '~/components/stream/TeacherCard.vue'
import moment from 'moment'
import TextMessageOverlay from '~/pages/teacher/account/TextMessageOverlay.vue'
import { usePreJoinChat } from '~/composables/stream/usePreJoinChat'

const props = defineProps<{
  streamUser: object
  callId: string
  lessonMeetingId: number
  callType: string
}>()

const lessonStore = useLessonBookStore()
const lessonDetails = computed(() => lessonStore.getLessonMeeting || {})

const emit = defineEmits(['join-call'])
const toast = useToast()
const config = useRuntimeConfig()
const streamStore = useStreamStore()
const { $siteSettings } = useNuxtApp()
const siteSettingsStore = useSiteSettingsStore()
const { is } = useGlobalStore()

// API setup
const apiKey = config.public.streamApiKey
const token = computed(() => streamStore.getStreamToken)

const teacher = computed(() => lessonDetails.value?.teacher)

const scheduledTime = computed(() => {
  if (!lessonDetails.value?.scheduledAt) return null
  return new Date(lessonDetails.value.scheduledAt)
})

const formattedScheduledTime = computed(() => {
  if (!scheduledTime.value) return 'Not scheduled'
  return moment(scheduledTime.value).format('MMM DD HH:mm')
})

// Reactive computed property that ensures we have the latest site settings
const siteLogo = computed(() => {
  const settings = $siteSettings as Record<string, string> | undefined
  return (
    settings?.siteLogo || siteSettingsStore.getSiteSettings?.siteLogo || null
  )
})

const isCameraOn = ref(true)
const isMicrophoneOn = ref(true)
const selectedCameraId = ref<string>('')
const selectedMicrophoneId = ref<string>('')
const selectedSpeakerId = ref<string>('')
const availableCameras = ref<MediaDeviceInfo[]>([])
const availableMicrophones = ref<MediaDeviceInfo[]>([])
const availableSpeakers = ref<MediaDeviceInfo[]>([])
const supportsSpeakerSelection = ref(false)

if (import.meta.client) {
  const testElement =
    typeof document !== 'undefined'
      ? (document.createElement('audio') as HTMLAudioElement & {
          setSinkId?: (sinkId: string) => Promise<void>
        })
      : null
  supportsSpeakerSelection.value =
    !!testElement && typeof testElement.setSinkId === 'function'
}

const isSpeakerSelectionDisabled = computed(() => {
  return !supportsSpeakerSelection.value || availableSpeakers.value.length === 0
})

const localVideo = ref<HTMLVideoElement | null>(null)
const localStream = ref<MediaStream | null>(null)
const showSettings = ref(false)
const isLoading = ref(true)

const meetingStateLabel = ref('Meeting starts in')
const meetingStateText = ref('starts in')
const meetingStateTime = ref<string | null>('--:--')
const canReportNoShow = ref(false)
const showNoShowCountdown = ref(false)
const noShowCountdownText = ref('05:00')
const reportHelperText = ref("You'll be able to report a teacher no-show soon.")

const { call, cleanup } = useVideoCall(
  apiKey,
  token.value as string,
  props.streamUser as any,
  props.callType,
  props.callId
)

const {
  isHost,
  isHostPresent,
  callLoadError,
  loadCall,
  setupHostPresenceTracking,
} = useHostPresenceTracking(call, props.streamUser as any, props.callId)

const {
  chatClient,
  chatChannel,
  isChatConnecting,
  chatError,
  toggleChat,
  isChatOpen,
} = usePreJoinChat(apiKey, token.value, props.streamUser.id)

const reportStore = useReportStore()

// Load call data
const initializeCall = async () => {
  isLoading.value = true
  try {
    await loadCall()
  } catch (error) {
    console.log(error)
  } finally {
    isLoading.value = false
  }

  if (callLoadError.value) {
    toast.add({
      severity: 'warn',
      summary: 'Cannot Join Call',
      detail: callLoadError.value,
      life: 5000,
    })
  }
}

// Load call data
const retryCall = async () => {
  isLoading.value = true
  try {
    await loadCall()
    await setupHostPresenceTracking()
  } catch (error) {
    console.log(error)
  } finally {
    isLoading.value = false
  }

  if (callLoadError.value) {
    toast.add({
      severity: 'warn',
      summary: 'Cannot Join Call',
      detail: callLoadError.value,
      life: 5000,
    })
  }
}

const formatTime = (totalSeconds: number) => {
  const s = Math.max(0, totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const handleReportNoShow = async () => {
  const payload = {
    reportingFor: "My teacher was late or didn't join",
    description:
      'I have been waiting for my teacher to join the call for over 5 minutes and would like to report a teacher no-show.',
  }

  try {
    reportStore.reportLesson(props.lessonMeetingId, payload)
  } catch (error) {
    console.error('Error reporting lesson:', error)
  }
}

// Enable report button
const enableReportButton = () => {
  canReportNoShow.value = true
  reportHelperText.value =
    'You can now report a teacher no-show if he or she has not joined.'
  showNoShowCountdown.value = false
}

// Constants for timer
const NO_SHOW_TIME_MS = 5 * 60 * 1000 // 5 minutes
let timerInterval = null

const tick = () => {
  if (!scheduledTime.value) return

  const now = Date.now()
  const scheduledTimeMs = scheduledTime.value.getTime()
  const diffMs = scheduledTimeMs - now
  const diffSeconds = Math.round(diffMs / 1000)

  // Update timer display based on state
  if (diffSeconds > 0) {
    // Meeting hasn't started yet - show countdown to start
    meetingStateLabel.value = 'Meeting starts in'
    meetingStateText.value = 'starts in'
    meetingStateTime.value = formatTime(diffSeconds)
    showNoShowCountdown.value = false

    // Reset no-show functionality if we're back to a future schedule time
    if (canReportNoShow.value) {
      canReportNoShow.value = false
      reportHelperText.value =
        "You'll be able to report a teacher no-show soon."
    }
  } else if (isHostPresent.value) {
    // Teacher is present
    meetingStateLabel.value = 'Your teacher is here!'
    meetingStateText.value = ''
    meetingStateTime.value = 'Join the call now'
    showNoShowCountdown.value = false
  } else {
    // Meeting has started but teacher isn't present
    meetingStateLabel.value = 'Session status'
    meetingStateText.value = 'Start time has passed'
    meetingStateTime.value = null // Hide the main countdown

    // Show no-show countdown
    showNoShowCountdown.value = true

    // Check if 5 minutes have passed since scheduled start
    const timeSinceScheduledStartMs = now - scheduledTimeMs
    if (timeSinceScheduledStartMs >= NO_SHOW_TIME_MS) {
      // Enable report button
      if (!canReportNoShow.value) {
        enableReportButton()
      }
    } else {
      // Update countdown for no-show reporting
      const remainingUntilReportMs = NO_SHOW_TIME_MS - timeSinceScheduledStartMs
      const remainingSeconds = Math.ceil(remainingUntilReportMs / 1000)
      noShowCountdownText.value = formatTime(remainingSeconds)
      canReportNoShow.value = false
      reportHelperText.value =
        "You'll be able to report a teacher no-show soon."
    }
  }
}

const startTimer = () => {
  // Clear any existing timer
  stopTimer()

  tick()

  timerInterval = setInterval(tick, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const hasTriggeredJoin = ref(false)

const closeSettings = () => {
  showSettings.value = false
  hasTriggeredJoin.value = false
}

const toggleSettings = () => {
  if (showSettings.value) {
    closeSettings()
  } else {
    showSettings.value = true
    hasTriggeredJoin.value = false
  }
}

const handleJoinCallButton = () => {
  if (callLoadError.value) {
    toast.add({
      severity: 'error',
      summary: 'Cannot Join Call',
      detail: 'There was an error loading the call. Please try again.',
      life: 3000,
    })
    return
  }

  if (!isHostPresent.value && !isHost.value) {
    // Show notification that host is not present
    toast.add({
      severity: 'warn',
      summary: 'Host Not Present',
      detail: 'Please wait for the host to join the call',
      life: 3000,
    })
    return
  }

  // Show settings on first click to recheck mic/camera
  if (!showSettings.value && !hasTriggeredJoin.value) {
    showSettings.value = true
    hasTriggeredJoin.value = true
    return
  }

  if (isHost.value) {
    if (props.callId.includes('admin-test-call')) {
      return
    }

    streamStore.notifyStudent(props.lessonMeetingId)
  }

  emit('join-call', {
    isCameraOn: isCameraOn.value,
    isMicrophoneOn: isMicrophoneOn.value,
    selectedCameraId: selectedCameraId.value,
    selectedMicrophoneId: selectedMicrophoneId.value,
    selectedSpeakerId: selectedSpeakerId.value,
  } satisfies PreJoinDeviceSettings)
}

const toggleCamera = async () => {
  isCameraOn.value = !isCameraOn.value
  if (isCameraOn.value) {
    await startCameraPreview()
  } else {
    await stopCameraPreview()
  }
}

// Toggle microphone
const toggleMicrophone = async () => {
  isMicrophoneOn.value = !isMicrophoneOn.value
  if (isMicrophoneOn.value) {
    await testMicrophoneAccess()
  }
}

// Test microphone access
const testMicrophoneAccess = async () => {
  try {
    const constraints: MediaStreamConstraints = {
      audio: selectedMicrophoneId.value
        ? { deviceId: { exact: selectedMicrophoneId.value } }
        : true,
      video: false,
    }

    const testStream = await navigator.mediaDevices.getUserMedia(constraints)

    // Stop the test stream immediately
    const tracks = testStream.getTracks()
    for (const track of tracks) {
      track.stop()
    }
  } catch (error) {
    console.error('Error testing microphone access:', error)
    isMicrophoneOn.value = false
    // Show error toast to user
    toast.add({
      severity: 'warn',
      summary: 'We could not detect your microphone.',
      detail: 'Please check your device settings and try again.',
      life: 3000,
    })
  }
}

// Start camera preview
const startCameraPreview = async () => {
  if (!localVideo.value) return

  try {
    // First ensure that any existing camera stream is properly cleaned up
    await stopCameraPreview()

    // Add a small delay to ensure resources are released
    await new Promise((resolve) => setTimeout(resolve, 300))

    const constraints: MediaStreamConstraints = {
      video: selectedCameraId.value
        ? { deviceId: { exact: selectedCameraId.value } }
        : true,
      audio: false,
    }

    localStream.value = await navigator.mediaDevices.getUserMedia(constraints)

    if (localVideo.value && localStream.value) {
      localVideo.value.srcObject = localStream.value
    }
  } catch (error) {
    console.error('Error starting camera preview:', error)
    isCameraOn.value = false
    // Show error toast to user
    toast.add({
      severity: 'warn',
      summary: "We couldn't detect your camera.",
      detail: 'Please check your device settings and try again.',
      life: 3000,
    })
  }
}

// Stop camera preview
const stopCameraPreview = async () => {
  try {
    if (localStream.value) {
      // Stop all tracks individually
      const tracks = localStream.value.getTracks()
      for (const track of tracks) {
        track.stop()
      }
      localStream.value = null
    }

    if (localVideo.value) {
      localVideo.value.srcObject = null
    }
  } catch (error) {
    console.error('Error stopping camera preview:', error)
  }
}

// Change camera
const changeCamera = async () => {
  if (isCameraOn.value && selectedCameraId.value) {
    console.log('changing camera', selectedCameraId.value)
    // Set a loading state while changing camera
    const previousCameraId = selectedCameraId.value
    try {
      await startCameraPreview()
    } catch (error) {
      console.error('Failed to change camera:', error)
      // Revert to previous camera if change fails
      selectedCameraId.value = previousCameraId
    }
  }
}

// Get available devices
const getAvailableDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()

    // Get available cameras
    const cameras = devices.filter(
      (device) =>
        device.kind === 'videoinput' &&
        device.deviceId !== 'default' &&
        device.deviceId !== 'communications'
    )
    availableCameras.value = cameras
    if (cameras.length > 0 && !selectedCameraId.value) {
      selectedCameraId.value = cameras[0].deviceId
    }

    // Get available microphones
    const microphones = devices.filter(
      (device) =>
        device.kind === 'audioinput' &&
        device.deviceId !== 'default' &&
        device.deviceId !== 'communications'
    )
    availableMicrophones.value = microphones
    if (microphones.length > 0 && !selectedMicrophoneId.value) {
      selectedMicrophoneId.value = microphones[0].deviceId
    }

    if (supportsSpeakerSelection.value) {
      const speakers = devices.filter(
        (device) =>
          device.kind === 'audiooutput' &&
          device.deviceId !== 'default' &&
          device.deviceId !== 'communications'
      )
      availableSpeakers.value = speakers
      if (speakers.length > 0 && !selectedSpeakerId.value) {
        selectedSpeakerId.value = speakers[0].deviceId
      }
    } else {
      availableSpeakers.value = []
    }
  } catch (error) {
    console.error('Error getting available devices:', error)
  }
}

// Listen for device changes
const setupDeviceChangeListener = () => {
  if (navigator.mediaDevices?.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', getAvailableDevices)
  }
}

// Computed property for button state
const isJoinCallButtonDisabled = computed(() => {
  return (
    (!isHostPresent.value && !isHost.value) ||
    !!callLoadError.value ||
    isLoading.value
  )
})

// Watch for host presence changes
watch(isHostPresent, (newValue) => {
  if (props.callId.includes('admin-test-call')) {
    return
  }

  if (newValue) {
    toast.add({
      severity: 'success',
      summary: 'Host Joined',
      detail: 'Host has joined the call. You can now join!',
      life: 3000,
    })
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Host Left',
      detail: 'Host has left the call. Please wait for the host to return.',
      life: 3000,
    })
  }

  // Update timer display when host presence changes
  tick()
})

// Watch for changes to scheduled time
watch(scheduledTime, () => {
  tick()
})

onMounted(async () => {
  try {
    await getAvailableDevices()
    setupDeviceChangeListener()
    if (isCameraOn.value) {
      await startCameraPreview()
    }
    if (isMicrophoneOn.value) {
      await testMicrophoneAccess()
    }
    await initializeCall()

    // Start timer for meeting countdown
    startTimer()
  } catch (error) {
    console.error('Error during initialization:', error)
  }
})

onBeforeUnmount(async () => {
  try {
    await stopCameraPreview()
    if (navigator.mediaDevices?.removeEventListener) {
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        getAvailableDevices
      )
    }
    await cleanup()

    stopTimer()
  } catch (error) {
    console.log(error)
  }
})
</script>

<template>
  <div
    class="min-h-screen bg-black text-white flex flex-col items-center px-4 sm:px-6 py-8 sm:py-10"
    :class="{ 'modal-active': showSettings }"
  >
    <div
      class="w-full max-w-6xl flex flex-wrap items-start justify-between gap-6 pb-3"
    >
      <div class="flex flex-col gap-1">
        <div
          class="text-xl tracking-[0.25em] font-light uppercase flex gap-2 cursor-pointer"
          @click="navigateTo('/')"
        >
          <img
            v-if="siteLogo"
            :src="siteLogo"
            alt="Craft Music"
            class="h-10"
            style="filter: brightness(0) invert(1)"
          />
        </div>
        <p class="text-[11px] uppercase tracking-[0.35em] text-neutral-500">
          Online lesson room
        </p>
      </div>

      <!-- Teacher info under video preview - Mobile only -->

      <p class="text-[11px] text-neutral-400 text-right lg:text-right">
        Need to report a concern instead?
        <!-- :to="`/student/account/report?lessonId=${props.callId}`" -->
        <NuxtLink
          :to="`/report`"
          class="ml-1 underline font-semibold text-white hover:text-neutral-200"
        >
          Share it here.
        </NuxtLink>
      </p>
    </div>

    <div
      class="w-full max-w-6xl flex flex-col lg:flex-row gap-4 lg:gap-6 items-start justify-center"
    >
      <!-- LEFT COLUMN -->
      <div class="w-full md:flex-1 flex flex-col gap-4 h-full">
        <div
          v-if="callType != 'admin-test'"
          class="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 block md:hidden"
        >
          <p class="text-[0.65rem] uppercase tracking-[0.2em] text-slate-400">
            Session status
          </p>
          <h1
            class="mt-2 text-base font-semibold text-neutral-100 tracking-tight"
          >
            {{ meetingStateLabel }}
          </h1>

          <div class="mt-4 space-y-2 text-xs text-slate-400">
            <div class="flex justify-between">
              <span>Teacher</span
              ><span>{{ lessonDetails.teacher?.firstName }}</span>
            </div>
            <div class="flex justify-between">
              <span>Start</span><span>{{ formattedScheduledTime }}</span>
            </div>
          </div>

          <div
            v-if="meetingStateTime"
            class="mt-4 flex justify-between items-center text-sm uppercase tracking-[0.2em] text-slate-400"
          >
            <span>{{ meetingStateText }}</span>
            <span class="text-2xl font-bold tabular-nums text-white">{{
              meetingStateTime
            }}</span>
          </div>
          <div
            v-else
            class="mt-4 text-center text-sm uppercase tracking-[0.2em] text-slate-400"
          >
            <span>{{ meetingStateText }}</span>
          </div>
        </div>
        <!-- Video + Teacher info -->
        <div class="w-full space-y-6">
          <!-- Video Player -->
          <div
            class="bg-[#151515] rounded-3xl shadow-2xl aspect-video flex flex-col items-center justify-center overflow-hidden relative"
          >
            <video
              class="w-full h-full object-cover -scale-x-100"
              ref="localVideo"
              autoplay
              muted
              playsinline
            ></video>

            <!-- Join Call / Dashboard Button -->
            <div
              class="flex flex-col items-center gap-3 sm:gap-4 mt-[-40px] sm:mt-10 absolute"
            >
              <p
                id="centerJoinMsg"
                class="text-center text-[10px] sm:text-sm text-white bg-black/40 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl max-w-[90%] sm:max-w-none"
              >
                Your call
                {{
                  lessonDetails.teacher?.firstName
                    ? 'with ' + lessonDetails.teacher?.firstName
                    : ''
                }}
                will start shortly - thank you for your patience.
              </p>
              <button
                :class="
                  isJoinCallButtonDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:!bg-[#09503A]'
                "
                class="w-[140px] sm:w-[200px] rounded-full !bg-[#09503A]/80 text-white border-none font-semibold py-1.5 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm"
                :disabled="isJoinCallButtonDisabled"
                :loading="isLoading"
                @click="handleJoinCallButton"
              >
                Join Call
              </button>
            </div>
            <div
              class="flex gap-3 sm:gap-4 mt-8 sm:mt-10 absolute bottom-4 sm:bottom-6"
            >
              <button
                class="h-9 w-9 sm:h-11 sm:w-11 rounded-full flex items-center justify-center"
                :class="
                  isMicrophoneOn
                    ? 'bg-[#222] text-neutral-200'
                    : 'bg-red-600 text-white'
                "
                @click="toggleMicrophone"
              >
                <Icon
                  v-if="isMicrophoneOn"
                  name="lucide:mic"
                  class="w-4 h-4 sm:w-5 sm:h-5"
                  size="20"
                />
                <Icon
                  v-else
                  name="lucide:mic-off"
                  class="w-4 h-4 sm:w-5 sm:h-5"
                  size="20"
                />
              </button>

              <button
                class="h-9 w-9 sm:h-11 sm:w-11 rounded-full flex items-center justify-center"
                :class="
                  isCameraOn
                    ? 'bg-[#222] text-neutral-200'
                    : 'bg-red-600 text-white'
                "
                @click="toggleCamera"
              >
                <Icon
                  v-if="isCameraOn"
                  name="lucide:camera"
                  class="w-4 h-4 sm:w-5 sm:h-5"
                  size="20"
                />
                <Icon
                  v-else
                  name="lucide:camera-off"
                  class="w-4 h-4 sm:w-5 sm:h-5"
                  size="20"
                />
              </button>

              <button
                class="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-[#222] text-neutral-200 flex items-center justify-center"
                @click="toggleSettings"
              >
                <Icon
                  name="lucide:settings"
                  class="w-4 h-4 sm:w-5 sm:h-5"
                  size="20"
                />
              </button>
            </div>
          </div>

          <TeacherCard v-if="callType != 'admin-test'" :course="teacher" />

          <!-- Device Settings Dialog -->
          <div v-if="showSettings" class="settings-popover">
            <div class="settings-popover-header">
              <h3>Device Settings</h3>
              <button
                class="close-button"
                @click="closeSettings"
                aria-label="Close settings"
              >
                <BaseLucide name="X" :size="18" />
              </button>
            </div>
            <div class="settings-popover-content">
              <div
                v-if="hasTriggeredJoin"
                class="bg-black/30 p-3 rounded-lg border border-white/10 mb-5 text-center"
              >
                <p class="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                  Before joining the call, please re-check your camera and
                  microphone settings to ensure everything is working correctly!
                </p>
              </div>
              <div class="select-group">
                <label for="camera-select">Camera</label>
                <select
                  id="camera-select"
                  v-model="selectedCameraId"
                  @change="changeCamera"
                  :disabled="!isCameraOn"
                >
                  <option
                    v-for="camera in availableCameras"
                    :key="camera.deviceId"
                    :value="camera.deviceId"
                  >
                    {{
                      camera.label ||
                      `Camera ${camera.deviceId.substring(0, 5)}...`
                    }}
                  </option>
                </select>
              </div>
              <div class="select-group">
                <label for="microphone-select">Microphone</label>
                <select
                  id="microphone-select"
                  v-model="selectedMicrophoneId"
                  :disabled="!isMicrophoneOn"
                >
                  <option
                    v-for="mic in availableMicrophones"
                    :key="mic.deviceId"
                    :value="mic.deviceId"
                  >
                    {{
                      mic.label ||
                      `Microphone ${mic.deviceId.substring(0, 5)}...`
                    }}
                  </option>
                </select>
              </div>
              <div class="select-group">
                <label for="speaker-select">Speakers</label>
                <select
                  id="speaker-select"
                  v-model="selectedSpeakerId"
                  :disabled="isSpeakerSelectionDisabled"
                >
                  <option
                    v-if="availableSpeakers.length === 0"
                    disabled
                    value=""
                  >
                    No speakers detected
                  </option>
                  <option
                    v-for="speaker in availableSpeakers"
                    :key="speaker.deviceId"
                    :value="speaker.deviceId"
                  >
                    {{
                      speaker.label ||
                      `Speaker ${speaker.deviceId.substring(0, 5)}...`
                    }}
                  </option>
                </select>
                <small
                  v-if="!supportsSpeakerSelection"
                  class="select-helper-text"
                >
                  Audio output selection is not supported in this browser.
                </small>
              </div>

              <button
                v-if="hasTriggeredJoin"
                class="mt-6 w-full rounded-full !bg-[#09503A] text-white py-2.5 text-sm font-semibold hover:!bg-[#0c6348] transition-colors"
                @click="handleJoinCallButton"
              >
                Join Call
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- SIDEBAR COLUMN -->
      <div
        v-if="callType != 'admin-test'"
        class="w-full lg:w-[340px] flex flex-col gap-4"
      >
        <!-- STATUS CARD -->
        <div
          v-if="isLoading"
          class="rounded-3xl bg-zinc-900 border border-zinc-800 p-6"
        >
          <p class="text-sm font-semibold text-neutral-200">
            Loading call information...
          </p>
        </div>
        <div
          v-else-if="callLoadError"
          class="w-full lg:w-[320px] md:max-w-[320px] flex flex-col gap-4 flex-shrink-0"
        >
          <p class="text-sm font-semibold text-neutral-200">
            {{ callLoadError }}
          </p>
          <Button
            label="Retry"
            class="w-full"
            :loading="isLoading"
            @click="retryCall"
          />
        </div>
        <div
          v-else
          class="rounded-3xl bg-zinc-900 border border-zinc-800 p-6 hidden md:block"
        >
          <p class="text-[0.65rem] uppercase tracking-[0.2em] text-slate-400">
            Session status
          </p>
          <h1
            class="mt-2 text-base font-semibold text-neutral-100 tracking-tight"
          >
            {{ meetingStateLabel }}
          </h1>

          <div class="mt-4 space-y-2 text-xs text-slate-400">
            <div class="flex justify-between">
              <span>Teacher</span
              ><span>{{ lessonDetails.teacher?.firstName }}</span>
            </div>
            <div class="flex justify-between">
              <span>Start</span><span>{{ formattedScheduledTime }}</span>
            </div>
          </div>

          <div
            v-if="meetingStateTime"
            class="mt-4 flex justify-between items-center text-sm uppercase tracking-[0.2em] text-slate-400"
          >
            <span>{{ meetingStateText }}</span>
            <span class="text-2xl font-bold tabular-nums text-white">{{
              meetingStateTime
            }}</span>
          </div>
          <div
            v-else
            class="mt-4 text-center text-sm uppercase tracking-[0.2em] text-slate-400"
          >
            <span>{{ meetingStateText }}</span>
          </div>
        </div>

        <!-- Teacher Late Block -->
        <div
          class="mt-4 bg-[#101010] border border-neutral-800 rounded-2xl px-5 py-4 space-y-4"
        >
          <p
            class="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400"
          >
            Need more time?
          </p>

          <ul class="mt-3 text-xs text-slate-300 space-y-2 list-disc pl-4">
            <li>Message your teacher to let them know you're ready.</li>
            <li>
              If they need more time or want to reschedule, reply in the chat to
              confirm.
            </li>
            <li>
              If your teacher still hasn't joined after a few minutes, you can
              report a no-show.
            </li>
          </ul>

          <div class="flex flex-col gap-3">
            <button
              class="mt-4 w-full rounded-full bg-white text-black py-2.5 text-sm font-semibold"
              @click="toggleChat"
            >
              Send teacher a message
            </button>

            <button
              class="w-full rounded-full text-black py-2.5 text-sm font-semibold"
              :class="
                canReportNoShow
                  ? 'bg-red-600 text-white border-red-500 hover:bg-red-500 cursor-pointer'
                  : 'hidden bg-[#1f1f1f] text-neutral-500 border border-neutral-800 cursor-not-allowed'
              "
              :disabled="!canReportNoShow || is('reportLesson')"
              @click="handleReportNoShow"
            >
              {{
                is('reportLesson') ? 'Submitting...' : 'Report teacher no-show'
              }}
            </button>
          </div>
          <p
            v-if="!canReportNoShow && showNoShowCountdown"
            id="report-helper"
            class="text-[11px] text-neutral-500 text-center"
          >
            {{ reportHelperText }}
            <span
              class="block mt-1 text-base font-mono text-neutral-400 tracking-widest"
            >
              {{ noShowCountdownText }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>

  <TextMessageOverlay
    v-if="!is('fetchLessonMeeting')"
    :visible="isChatOpen"
    :chat-client="chatClient"
    :chat-channel="chatChannel"
    :is-connecting="isChatConnecting"
    :error="chatError"
    @update:visible="toggleChat"
  />
</template>

<style scoped>
.pre-join-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem 1rem 1rem;
  background-color: rgb(0, 0, 0);
  color: rgb(255, 254, 254);
  height: 100vh;
  width: 100%;
  margin: 0 auto;
  font-family: 'Google Sans', Roboto, Arial, sans-serif;
}
.pre-join-content {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  max-width: 1200px;
  gap: 2.5rem;
}
.video-preview-container {
  flex: 1 1 0;
  max-width: 600px;
  min-width: 0;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.side-panel {
  flex: 1 1 0;
  min-width: 320px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0.5rem;
}
.ready-text {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-align: center;
  color: #e0e0e0;
}
.video-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background-color: #2e2e2e;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.video-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.camera-off-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  font-size: 1.5rem;
  z-index: 2;
}
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.8);
  font-size: 1.2rem;
  z-index: 5;
  gap: 1rem;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #d2fb54;
  animation: spin 1s ease-in-out infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.8);
  color: #c3f73a; /* Amber-400, a prominent warning color */
  font-size: 1.2rem;
  z-index: 5;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
}
.retry-button {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background-color: #d2fb54;
  color: #222;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}
.retry-button:hover {
  background-color: #b4e043;
}
.video-device-controls {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1.5rem;
  z-index: 3;
}
.icon-control-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background-color: #23272b;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  transition:
    background 0.2s,
    color 0.2s;
  cursor: pointer;
}
.icon-control-button:hover {
  background-color: #444950;
}
.icon-control-button.off {
  background-color: #d93025;
  color: #fff;
}
.icon-control-button.off:hover {
  background-color: #c5221f;
}
.user-name {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  z-index: 4;
}
.device-select-controls {
  display: none;
}
.join-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  margin-top: 0;
  justify-content: center;
}
.join-button {
  padding: 0.75rem 2.5rem;
  background-color: #d2fb54;
  color: #222;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  letter-spacing: 0.25px;
  box-shadow: 0 2px 6px rgba(210, 251, 84, 0.3);
}
.join-button:hover {
  background-color: #b4e043;
  box-shadow: 0 4px 8px rgba(180, 224, 67, 0.4);
}
.join-button.disabled {
  background-color: #666;
  cursor: not-allowed;
  box-shadow: none;
}
.join-button.disabled:hover {
  background-color: #666;
  box-shadow: none;
}
.join-button.error-state {
  background-color: #ff5252;
  color: white;
  box-shadow: 0 2px 6px rgba(255, 82, 82, 0.3);
}

.join-button.error-state:hover {
  background-color: #ff3838;
  box-shadow: 0 4px 8px rgba(255, 56, 56, 0.4);
}

.dashboard-button {
  padding: 0.75rem 2.5rem;
  background-color: transparent;
  color: #e0e0e0;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s;
  letter-spacing: 0.25px;
}

.dashboard-button:hover {
  background-color: #e0e0e0;
  color: #222;
  border-color: #e0e0e0;
}
.modal-active::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 9;
  animation: fadeIn 0.2s ease;
}

.settings-popover {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  min-width: 320px;
  max-width: 600px;
  background: #18191c;
  border-radius: 14px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.32),
    0 1.5px 6px rgba(60, 64, 67, 0.12);
  border: 1px solid #23272b;
  padding: 0;
  animation: modalFadeIn 0.2s ease-out;
  color: #f3f4f6;
  will-change: transform, opacity;
}
.settings-popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #23272b;
}
.settings-popover-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
}
.close-button {
  background: transparent;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.2s,
    color 0.2s;
}
.close-button:hover {
  background-color: #2e2e2e;
  color: #ffffff;
}
.settings-popover-content {
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1.5rem;
}
.settings-popover .select-group label {
  font-size: 0.97rem;
  font-weight: 500;
  color: #e0e0e0;
  margin-bottom: 0.4rem;
}
.settings-popover .select-group select {
  width: 100%;
  padding: 0.6rem 0.9rem;
  background: #23272b;
  color: #f3f4f6;
  border: 1px solid #35363a;
  border-radius: 8px;
  font-size: 0.97rem;
  outline: none;
  transition:
    border 0.2s,
    background 0.2s;
  margin-bottom: 0.1rem;
  appearance: none;
}
.settings-popover .select-group select:focus {
  border-color: #8ab4f8;
  background: #23272b;
}
.settings-popover .select-group select option {
  background: #23272b;
  color: #f3f4f6;
}
.settings-popover .select-group:not(:last-child) {
  border-bottom: 1px solid #23272b;
  padding-bottom: 1rem;
  margin-bottom: 0.5rem;
}
.settings-popover .select-group:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
}
.settings-popover .select-group {
  display: flex;
  flex-direction: column;
}
.settings-popover .select-helper-text {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 0.35rem;
}
.settings-icon-button {
  margin-left: 0.5rem;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalFadeIn {
  from {
    opacity: 0;

    transform: translate(-50%, -48%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}
@media (max-width: 900px) {
  .pre-join-content {
    flex-direction: column;
    gap: 2rem;
    align-items: stretch;
  }
  .video-preview-container,
  .side-panel {
    max-width: 100%;
    min-width: 0;
  }
}
@media (max-width: 700px) {
  .pre-join-content {
    flex-direction: column;
    gap: 1.5rem;
    padding: 0;
  }
  .video-preview-container,
  .side-panel {
    max-width: 100%;
    min-width: 0;
  }
}
</style>
