<script setup lang="ts">
import { useVideoCall } from '~/composables/stream/useVideoCall'
import type { PreJoinDeviceSettings } from '@/types/stream/pre-join.type'
import { useHostPresenceTracking } from '@/composables/stream/useHostPresenceTracking'

const props = defineProps<{
  streamUser: object
  callId: string
  lessonMeetingId: number
  callType: string
}>()

const emit = defineEmits(['join-call'])
const toast = useToast()
const config = useRuntimeConfig()
const streamStore = useStreamStore()
const authStore = useAuthStore()
const router = useRouter()

// API setup
const apiKey = config.public.streamApiKey
const token = computed(() => streamStore.getStreamToken)

// Device states
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

// Get video call functionality
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

// Handle joining the call
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

// Handle dashboard navigation
const handleGoToDashboard = () => {
  if (authStore.getUser?.role === 'STUDENT') {
    router.push('/student/account')
  } else if (authStore.getUser?.role === 'ADMIN') {
    router.push('/admin-test-call')
  } else {
    router.push('/teacher/account')
  }
}

// Toggle camera
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
      summary: 'We couldn’t detect your camera.',
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
    // Show notification when host joins
    toast.add({
      severity: 'success',
      summary: 'Host Joined',
      detail: 'Host has joined the call. You can now join!',
      life: 3000,
    })
  } else {
    // Show notification when host leaves
    toast.add({
      severity: 'warn',
      summary: 'Host Left',
      detail: 'Host has left the call. Please wait for the host to return.',
      life: 3000,
    })
  }
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
  } catch (error) {
    console.log(error)
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
  } catch (error) {
    console.log(error)
  }
})
</script>

<template>
  <div class="pre-join-screen" :class="{ 'modal-active': showSettings }">
    <div class="pre-join-content">
      <!-- Left: Video Preview -->
      <div class="video-preview-container">
        <div class="video-preview">
          <video ref="localVideo" autoplay muted playsinline></video>
          <div v-if="!isCameraOn" class="camera-off-overlay">
            <span>Camera is off</span>
          </div>
          <!-- Loading overlay -->
          <div v-if="isLoading" class="loading-overlay">
            <div class="spinner"></div>
            <span>Loading call...</span>
          </div>
          <!-- Error overlay -->
          <div v-if="callLoadError && !isLoading" class="error-overlay">
            <BaseLucide name="AlertCircle" :size="36" />
            <span>{{ callLoadError }}</span>
            <button class="retry-button" @click="retryCall">Retry</button>
          </div>
          <!-- Overlay device controls -->
          <div class="video-device-controls">
            <button
              class="icon-control-button"
              :class="{ off: !isMicrophoneOn }"
              @click="toggleMicrophone"
              :title="
                isMicrophoneOn ? 'Turn Off Microphone' : 'Turn On Microphone'
              "
            >
              <BaseLucide
                :name="isMicrophoneOn ? 'Mic' : 'MicOff'"
                :size="24"
              />
            </button>
            <button
              class="icon-control-button"
              :class="{ off: !isCameraOn }"
              @click="toggleCamera"
              :title="isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'"
            >
              <BaseLucide
                :name="isCameraOn ? 'Video' : 'VideoOff'"
                :size="24"
              />
            </button>
            <!-- Settings button -->
            <button
              class="icon-control-button settings-icon-button"
              @click="showSettings = !showSettings"
              :aria-expanded="showSettings"
              title="Device Settings"
            >
              <BaseLucide name="Settings" :size="24" />
            </button>
          </div>
        </div>
      </div>
      <div v-if="showSettings" class="settings-popover">
        <div class="settings-popover-header">
          <h3>Device Settings</h3>
          <button
            class="close-button"
            @click="showSettings = false"
            aria-label="Close settings"
          >
            <BaseLucide name="X" :size="18" />
          </button>
        </div>
        <div class="settings-popover-content">
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
                  camera.label || `Camera ${camera.deviceId.substring(0, 5)}...`
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
                  mic.label || `Microphone ${mic.deviceId.substring(0, 5)}...`
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
              <option v-if="availableSpeakers.length === 0" disabled value="">
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
            <small v-if="!supportsSpeakerSelection" class="select-helper-text">
              Audio output selection is not supported in this browser.
            </small>
          </div>
        </div>
      </div>
      <!-- Right: Logo, Text, Join Button -->
      <div class="side-panel">
        <div class="logo-container">
          <BaseGlobalIcon
            component-name="BrandIconWhite"
            data-cy="brand-icon"
          />
        </div>
        <div class="ready-text mt-10">Are you ready to join?</div>
        <div class="join-controls">
          <button
            v-if="!callLoadError && !isLoading"
            class="join-button mt-4"
            @click="handleJoinCallButton"
            :disabled="isJoinCallButtonDisabled"
            :class="{
              disabled: isJoinCallButtonDisabled,
              'error-state': callLoadError,
            }"
          >
            <span>{{
              isHostPresent || isHost ? 'Join Call' : 'Waiting for teacher'
            }}</span>
          </button>

          <button class="dashboard-button mt-4" @click="handleGoToDashboard">
            Go to Dashboard
          </button>
        </div>
        <!-- <div class="join-controls">
          <button class="join-button mt-4" @click="handleJoinCallButton">
            {{ 'Join Call' }}
          </button>
        </div> -->
      </div>
    </div>
  </div>
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
