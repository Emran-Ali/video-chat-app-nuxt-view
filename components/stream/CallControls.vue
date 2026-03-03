<script setup lang="ts">
import type { Call, StreamVideoParticipant } from '@stream-io/video-client'
import { useNoiseCancellation } from '~/composables/stream/useNoiseCancellation'
import { useRecording } from '~/composables/stream/useRecording'
import { isMobile } from '~/utils/stream/Mobile'

import type {
  ConnectionQuality,
  ConnectionStatus,
} from '~/composables/stream/useVideoCall'

// Define a safe type for MediaDeviceInfo
interface SafeMediaDeviceInfo {
  deviceId: string
  label: string
  kind: string
  groupId: string
}

const props = defineProps<{
  call: Call
  connectionStatus: ConnectionStatus
  connectionQuality: ConnectionQuality
  micStatus: string
  cameraStatus: string
  screenShareStatus: string
  cameraDirection: string
  volume: number
  screenSharingParticipant?: StreamVideoParticipant
  chatReceiverParticipant?: string | null //used to track the other participant for chat
  unreadMessageCount?: number
  callEndTime?: string | undefined
}>()

const streamStore = useStreamStore()
const { play } = useSound('/sound/notification.wav')
const { is } = useGlobalStore()

// UI state
const showSettings = ref(false)

const isSomeoneElseSharing = computed(() => {
  if (!props.screenSharingParticipant) return false

  const isCurrentUserSharing = props.screenShareStatus === 'enabled'

  return !isCurrentUserSharing
})

// Initialize noise cancellation composable
const {
  noiseCancellation,
  isNoiseCancellationSupported,
  isNoiseCancellationEnabled,
  noiseCancellationLevel,
  toggleNoiseCancellation,
  initializeNoiseCancellation,
  cleanupNoiseCancellation,
} = useNoiseCancellation(props.call)

// Initialize recording composable
const {
  isRecording,
  recordingStartTime,
  isRecordingLoading,
  recordingNotification,
  recordingNotificationType,
  toggleRecording,
  cleanup: cleanupRecording,
} = useRecording(props.call)

// Audio button state
const toggleMic = async () => {
  await props.call.microphone.toggle()
}

// Video button state
const toggleCamera = async () => {
  await props.call.camera.toggle()
}

// Screen share button state
const toggleScreenShare = async () => {
  // Setup screen share settings
  props.call.screenShare.enableScreenShareAudio()
  await props.call.screenShare.toggle()
}

// Camera flip button state (mobile only)
const flipCamera = async () => {
  await props.call.camera.flip()
}

// Volume control state
const setVolume = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  console.log('Setting volume to:', value)
  props.call.speaker.setVolume(parseFloat(value))
}

// Audio devices state
const audioDevices = ref<SafeMediaDeviceInfo[]>([])
const selectAudioDevice = async (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  const currentMicState = props.micStatus === 'enabled'

  try {
    if (currentMicState) {
      await props.call.microphone.disable()
    }

    await props.call.microphone.select(value)

    if (currentMicState) {
      await props.call.microphone.enable()
    }
  } catch (error) {
    console.error('Error while switching microphone:', error)
    // Try to restore previous state if possible
    if (currentMicState) {
      try {
        await props.call.microphone.enable()
      } catch (restoreError) {
        console.error('Failed to restore microphone state:', restoreError)
      }
    }
  }
}

// Video devices state
const videoDevices = ref<SafeMediaDeviceInfo[]>([])
const selectVideoDevice = async (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  const currentCameraState = props.cameraStatus === 'enabled'

  try {
    // Disable camera first if it's enabled
    if (currentCameraState) {
      await props.call.camera.disable()
    }

    // Select the new camera device
    await props.call.camera.select(value)

    // Re-enable camera if it was enabled before
    if (currentCameraState) {
      await props.call.camera.enable()
    }
  } catch (error) {
    console.error('Error while switching camera:', error)
    // Try to restore previous state if possible
    if (currentCameraState) {
      try {
        await props.call.camera.enable()
      } catch (restoreError) {
        console.error('Failed to restore camera state:', restoreError)
      }
    }
  }
}

// Audio output devices state
const audioOutputSupported = ref(false)
const audioOutputDevices = ref<SafeMediaDeviceInfo[]>([])
const selectAudioOutput = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  props.call.speaker.select(value)
}

// Define emit for connection status and leave/extend actions
const emit = defineEmits<{
  (e: 'leave-call' | 'toggle-chat'): void
}>()

// Leave call function
const leaveCall = () => {
  emit('leave-call')
}

// Chat toggle function
const toggleChat = () => {
  emit('toggle-chat')
}

// Convert MediaDeviceInfo to SafeMediaDeviceInfo
const toSafeMediaDeviceInfo = (
  device: MediaDeviceInfo
): SafeMediaDeviceInfo => {
  return {
    deviceId: device.deviceId || 'default',
    label:
      device.label || `Device-${device.deviceId?.slice(0, 4) || 'unknown'}`,
    kind: device.kind || 'unknown',
    groupId: device.groupId || 'default',
  }
}

// Click handler to close settings dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (showSettings.value && !target.closest('.device-settings')) {
    showSettings.value = false
  }
}

onMounted(async () => {
  // Initialize noise cancellation using the composable
  await initializeNoiseCancellation()

  // Add click outside listener for settings dropdown
  document.addEventListener('click', handleClickOutside)

  // Get audio devices
  props.call.microphone.listDevices().subscribe({
    next: (devices) => {
      if (devices) {
        audioDevices.value = devices.map(toSafeMediaDeviceInfo)
      }
    },
    error: (error) => console.error(`Can't list audio devices: ${error}`),
  })

  // Get video devices
  props.call.camera.listDevices().subscribe({
    next: (devices) => {
      if (devices) {
        videoDevices.value = devices.map(toSafeMediaDeviceInfo)
      }
    },
    error: (error) => console.error(`Can't list video devices: ${error}`),
  })

  // Check if audio output selection is supported
  audioOutputSupported.value =
    props.call.speaker.state.isDeviceSelectionSupported

  // Get audio output devices if supported
  if (audioOutputSupported.value) {
    props.call.speaker.listDevices().subscribe({
      next: (devices) => {
        audioOutputDevices.value = devices.map(toSafeMediaDeviceInfo)
      },
      error: (error) =>
        console.error(`Can't list audio output devices: ${error}`),
    })
  }
})
// Clean up on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)

  // Clean up noise cancellation using the composable
  cleanupNoiseCancellation()

  // Clean up recording notifications
  cleanupRecording()
})

// Show extend prompt when 10 minutes remain (once per call)
const showExtendPrompt = ref(false)
const hasShownExtendPrompt = ref(false)

const dismissExtendPrompt = () => {
  showExtendPrompt.value = false
}

const extendByMinutes = async (minutes: number) => {
  try {
    await streamStore.extendCallDuration(props.call.id, minutes)
  } catch (error) {
    console.error('Error extending call:', error)
  } finally {
    showExtendPrompt.value = false
  }
}
</script>

<template>
  <!-- Recording notification - moved outside controls container -->

  <div
    v-if="recordingNotification"
    class="recording-notification"
    :class="recordingNotificationType"
  >
    <i
      class="pi"
      :class="{
        'pi-circle-fill': recordingNotificationType === 'start',
        'pi-stop-circle': recordingNotificationType === 'stop',
        'pi-exclamation-circle': recordingNotificationType === 'error',
      }"
    />
    {{ recordingNotification }}
  </div>

  <div
    class="controls-container"
    :class="{ disconnected: props.connectionStatus === 'disconnected' }"
  >
    <SharedBaseConfirmationDialog ref="confirmDialogRef" />

    <div
      class="flex flex-row justify-center lg:justify-between items-center w-full"
    >
      <!-- Connection quality indicator -->
      <div class="connection-quality-wrapper !hidden lg:!flex">
        <StreamConnectionQualityIndicator
          v-if="props.connectionStatus === 'connected'"
          :quality="props.connectionQuality"
        />
        <span class="connection-text">
          {{
            props.connectionStatus === 'connected'
              ? 'Connected'
              : props.connectionStatus === 'reconnecting'
                ? '🟠 Reconnecting...'
                : '🔴 Disconnected'
          }}
        </span>
      </div>
      <!-- Main controls -->
      <div class="main-controls">
        <!-- Mic control -->
        <button
          class="control-btn mic-btn"
          :class="{ enabled: props.micStatus === 'enabled' }"
          :disabled="props.connectionStatus === 'disconnected'"
          title="Toggle microphone"
          @click="toggleMic"
        >
          <span v-if="props.micStatus === 'enabled'" class="btn-icon">
            <i class="pi pi-microphone" />
          </span>
          <span v-else class="btn-icon">
            <i class="pi pi-microphone-slash" />
          </span>
        </button>

        <!-- Camera control -->
        <button
          class="control-btn camera-btn"
          :class="{ enabled: props.cameraStatus === 'enabled' }"
          :disabled="props.connectionStatus === 'disconnected'"
          title="Toggle camera"
          @click="toggleCamera"
        >
          <span v-if="props.cameraStatus === 'enabled'" class="btn-icon">
            <i class="pi pi-video" />
          </span>
          <span v-else class="btn-icon">
            <i class="pi pi-video-slash" />
          </span>
        </button>

        <!-- Music mode (noise cancellation) control -->
        <button
          v-if="isNoiseCancellationSupported"
          class="control-btn music-mode-btn"
          :class="{ enabled: !isNoiseCancellationEnabled }"
          :disabled="
            props.connectionStatus === 'disconnected' ||
            !isNoiseCancellationSupported ||
            props.micStatus !== 'enabled'
          "
          :title="
            !isNoiseCancellationSupported
              ? 'Music mode not supported in this browser'
              : props.micStatus !== 'enabled'
                ? 'Enable microphone first'
                : isNoiseCancellationEnabled
                  ? 'Music mode off'
                  : 'Music mode on'
          "
          @click="toggleNoiseCancellation"
        >
          <span class="btn-icon ml-[-2px]">
            <i class="pi pi-headphones" />
          </span>
        </button>

        <!-- Screen share control -->
        <button
          v-if="!isMobile.any()"
          class="control-btn screen-btn"
          :class="{ enabled: props.screenShareStatus === 'enabled' }"
          :disabled="
            props.connectionStatus === 'disconnected' ||
            !!isMobile.any() ||
            isSomeoneElseSharing
          "
          :title="
            isMobile.any()
              ? 'Screen sharing is not fully supported on mobile devices'
              : isSomeoneElseSharing
                ? 'Someone else is already sharing their screen'
                : props.screenShareStatus === 'enabled'
                  ? 'Stop sharing your screen'
                  : 'Share your screen'
          "
          @click="toggleScreenShare"
        >
          <span class="btn-icon">
            <i class="pi pi-desktop" />
          </span>
        </button>

        <!-- Recording control -->
        <button
          class="control-btn recording-btn"
          :class="{ active: isRecording, loading: isRecordingLoading }"
          :disabled="isRecordingLoading"
          title="Record call"
          @click="toggleRecording"
        >
          <i
            class="pi"
            :class="isRecording ? 'pi-stop-circle' : 'pi-circle-fill'"
          />
          <span v-if="isRecordingLoading" class="loading-indicator" />
        </button>

        <div
          v-if="props.connectionStatus === 'connected'"
          class="device-settings"
        >
          <button
            class="control-btn settings-btn"
            title="Device settings"
            @click="showSettings = !showSettings"
          >
            <span class="btn-icon">
              <i class="pi pi-cog" />
            </span>
          </button>

          <div v-if="showSettings" class="settings-dropdown">
            <!-- Audio device selector -->
            <div v-if="audioDevices.length" class="setting-group">
              <label>Microphone</label>
              <select class="cursor-pointer" @change="selectAudioDevice">
                <option
                  v-for="device in audioDevices"
                  :key="device.deviceId"
                  :value="device.deviceId"
                  :selected="
                    device.deviceId ===
                    props.call.microphone.state.selectedDevice
                  "
                  :title="device.label"
                >
                  {{ device.label }}
                </option>
              </select>
            </div>

            <!-- Video device selector -->
            <div
              v-if="videoDevices.length && !isMobile.any()"
              class="setting-group"
            >
              <label>Camera</label>
              <select class="cursor-pointer" @change="selectVideoDevice">
                <option
                  v-for="device in videoDevices"
                  :key="device.deviceId"
                  :value="device.deviceId"
                  :selected="
                    device.deviceId === props.call.camera.state.selectedDevice
                  "
                  :title="device.label"
                >
                  {{ device.label }}
                </option>
              </select>
            </div>

            <!-- Audio output selector (if supported) -->
            <div
              v-if="audioOutputSupported && audioOutputDevices.length"
              class="setting-group"
            >
              <label>Speaker</label>
              <select class="cursor-pointer" @change="selectAudioOutput">
                <option
                  v-for="device in audioOutputDevices"
                  :key="device.deviceId"
                  :value="device.deviceId"
                  :selected="
                    device.deviceId === props.call.speaker.state.selectedDevice
                  "
                  :title="device.label"
                >
                  {{ device.label }}
                </option>
              </select>
            </div>

            <!-- Noise cancellation level (if supported and enabled) -->
            <div
              v-if="isNoiseCancellationSupported && isNoiseCancellationEnabled"
              class="setting-group"
            >
              <label>Noise Suppression: {{ noiseCancellationLevel }}%</label>
              <input
                v-model="noiseCancellationLevel"
                class="cursor-pointer"
                type="range"
                min="0"
                max="100"
                step="10"
                @change="
                  noiseCancellation?.setSuppressionLevel(noiseCancellationLevel)
                "
              />
            </div>

            <!-- Volume control -->
            <div class="setting-group">
              <label>Main Volume: {{ Math.round(props.volume * 100) }}%</label>
              <input
                class="cursor-pointer"
                type="range"
                min="0"
                max="1"
                step="0.1"
                :value="props.volume"
                @change="setVolume"
              />
            </div>
          </div>
        </div>

        <!-- Chat toggle button -->
        <button
          class="control-btn chat-btn"
          :class="{ enabled: props.chatReceiverParticipant }"
          :disabled="
            props.connectionStatus === 'disconnected' ||
            !props.chatReceiverParticipant
          "
          :title="
            props.chatReceiverParticipant
              ? 'Toggle chat'
              : 'No other participant to chat with'
          "
          @click="toggleChat"
        >
          <span class="btn-icon">
            <i class="pi pi-comments" />
          </span>
          <!-- Unread message indicator -->
          <span
            v-if="props.unreadMessageCount && props.unreadMessageCount > 0"
            class="unread-indicator"
          >
            {{
              props.unreadMessageCount > 99 ? '99+' : props.unreadMessageCount
            }}
          </span>
        </button>

        <!-- Mobile camera flip button -->
        <button
          v-if="isMobile.any()"
          class="control-btn flip-btn"
          :disabled="
            props.connectionStatus === 'disconnected' ||
            props.cameraStatus !== 'enabled'
          "
          title="Flip camera"
          @click="flipCamera"
        >
          <span class="btn-icon">
            <i class="pi pi-refresh" />
          </span>
        </button>

        <!-- Leave call button -->
        <button
          class="control-btn leave-call-btn"
          :disabled="props.connectionStatus === 'disconnected'"
          title="Leave call"
          @click="leaveCall"
        >
          <span class="btn-icon">
            <i class="pi pi-phone" />
          </span>
        </button>
      </div>

      <div class="flex-row justify-between items-center gap-2 !hidden lg:!flex">
        <!-- Recording Timer -->
        <StreamRecordingTimer
          v-if="isRecording"
          :is-recording="isRecording"
          :start-time="recordingStartTime"
        />
      </div>
    </div>

    <!-- Additional controls -->
    <div class="additional-controls lg:!hidden">
      <!-- Connection quality indicator -->
      <div class="connection-quality-mobile status-pill">
        <StreamConnectionQualityIndicator
          v-if="props.connectionStatus === 'connected'"
          :quality="props.connectionQuality"
        />
        <span class="connection-text">
          {{
            props.connectionStatus === 'connected'
              ? 'Connected'
              : props.connectionStatus === 'reconnecting'
                ? '🟠 Reconnecting...'
                : '🔴 Disconnected'
          }}
        </span>
      </div>

      <!-- Recording Timer -->
      <StreamRecordingTimer
        v-if="isRecording"
        class="status-pill"
        :is-recording="isRecording"
        :start-time="recordingStartTime"
      />

      <!-- call countdown timer -->

      <div>
        <i class="pi pi-clock pill-icon" />
        TODO: need to implement call duration timer
      </div>
    </div>
  </div>
</template>

<style scoped>
.controls-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 0.5rem;
  padding-top: 0.5rem;

  backdrop-filter: blur(20px);
  width: 100%;
  box-sizing: border-box;
  z-index: 20;
  position: relative;
}

.main-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.additional-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 1200px;
  padding: 0 1.5rem;
  margin-top: 0.75rem;
}

/* Unified pill sizing */
.status-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
}

/* Modern button styling - Google Meet inspired */
.control-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #3c4043 0%, #2d2d30 100%);
  color: white;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.control-btn:hover {
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%);
}

.control-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.control-btn:disabled:hover {
  transform: none;
  background: linear-gradient(135deg, #3c4043 0%, #2d2d30 100%);
}

/* Button states */
.control-btn.enabled {
  background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);
  box-shadow:
    0 2px 8px rgba(26, 115, 232, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

.control-btn.enabled:hover {
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
  box-shadow:
    0 4px 16px rgba(26, 115, 232, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.15);
}

/* Special button styles */
.chat-btn {
  background: linear-gradient(135deg, #3c4043 0%, #2d2d30 100%);
}

.chat-btn:hover {
  background: linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%);
}

.chat-btn.enabled {
  background: linear-gradient(135deg, #34a853 0%, #2d7d32 100%);
  box-shadow:
    0 2px 8px rgba(52, 168, 83, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

.chat-btn.enabled:hover {
  background: linear-gradient(135deg, #43a047 0%, #388e3c 100%);
  box-shadow:
    0 4px 16px rgba(52, 168, 83, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.15);
}

.leave-call-btn {
  background: linear-gradient(135deg, #ea4335 0%, #d33426 100%);
  box-shadow:
    0 2px 8px rgba(234, 67, 53, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

.leave-call-btn:hover {
  background: linear-gradient(135deg, #f44336 0%, #e53935 100%);
  box-shadow:
    0 4px 16px rgba(234, 67, 53, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.15);
}

.recording-btn {
  background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);
  box-shadow:
    0 2px 8px rgba(26, 115, 232, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

.recording-btn:hover {
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
  box-shadow:
    0 4px 16px rgba(26, 115, 232, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.15);
}

.recording-btn.active {
  background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
  box-shadow:
    0 2px 8px rgba(229, 57, 53, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.1);
  animation: recording-pulse 2s infinite;
}

.recording-btn.loading {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  box-shadow:
    0 2px 8px rgba(243, 156, 18, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-icon {
  font-size: 22px;
  line-height: 1;
}

/* Loading indicator */
.loading-indicator {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

/* Connection quality indicator wrapper */
.connection-quality-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
}

.connection-quality-mobile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.connection-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  font-family:
    'Google Sans',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
}

/* Legacy connection status styles (kept for backward compatibility) */
.connection-status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family:
    'Google Sans',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
}

.connection-status.connected {
  color: #10b981;
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.1) 0%,
    rgba(5, 150, 105, 0.1) 100%
  );
  border-color: rgba(16, 185, 129, 0.2);
}

.connection-status.reconnecting {
  color: #f59e0b;
  background: linear-gradient(
    135deg,
    rgba(245, 158, 11, 0.1) 0%,
    rgba(217, 119, 6, 0.1) 100%
  );
  border-color: rgba(245, 158, 11, 0.2);
  animation: pulse 1.5s infinite;
}

.connection-status.disconnected {
  color: #ef4444;
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.1) 0%,
    rgba(220, 38, 38, 0.1) 100%
  );
  border-color: rgba(239, 68, 68, 0.2);
}

/* Noise cancellation status */
.noise-cancellation-status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family:
    'Google Sans',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
}

.noise-cancellation-status .status-enabled {
  color: #10b981;
  /* background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.1) 0%,
    rgba(5, 150, 105, 0.1) 100%
  ); */
}

.noise-cancellation-status .status-disabled {
  color: rgba(255, 255, 255, 0.6);
  /* background: rgba(255, 255, 255, 0.05); */
}

/* Device settings dropdown */
.device-settings {
  position: relative;
}

.settings-btn {
  background: linear-gradient(135deg, #3c4043 0%, #2d2d30 100%);
}

.settings-btn:hover {
  background: linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 100%);
}

.settings-dropdown {
  position: fixed;
  bottom: calc(60px + 1rem); /* Position above control buttons */
  right: 1rem;
  background: linear-gradient(135deg, #2d2d30 0%, #3a3a3d 100%);
  border-radius: 16px;
  padding: 1.5rem;
  width: 380px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 100;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: dropdownFadeIn 0.2s ease-out;
  /* Ensure dropdown doesn't overflow viewport */
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 140px);
  min-width: 240px;
  box-sizing: border-box;
  overflow-y: auto;
}

.setting-group {
  margin-bottom: 1.25rem;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  font-family:
    'Google Sans',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
}

.setting-group select {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
  color: white;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  /* Fix for dropdown overflow */
  max-width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  /* Custom dropdown arrow */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1em;
  padding-right: 2.5rem;
}

.setting-group select:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.2);
}

.setting-group select option {
  background: #2c2c2c;
  color: white;
  padding: 0.75rem;
  border: none;
  /* Ensure options don't overflow */
  max-width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  /* Better option styling */
  font-size: 0.875rem;
  line-height: 1.5;
}

.setting-group select option:hover {
  background: #3a3a3a;
}

.setting-group select option:checked {
  background: #1a73e8;
  color: white;
}

.setting-group input[type='range'] {
  width: 100%;
  margin-top: 0.5rem;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
}

.setting-group input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #1a73e8;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.setting-group input[type='range']::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #1a73e8;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

/* Recording notification */
.recording-notification {
  position: fixed;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  animation: slideDown 0.3s ease forwards;
  z-index: 1100;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family:
    'Google Sans',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
}

.recording-notification.start {
  background: linear-gradient(
    135deg,
    rgba(26, 115, 232, 0.9) 0%,
    rgba(21, 87, 176, 0.9) 100%
  );
}

.recording-notification.stop {
  background: linear-gradient(
    135deg,
    rgba(52, 152, 219, 0.9) 0%,
    rgba(41, 128, 185, 0.9) 100%
  );
}

.recording-notification.error {
  background: linear-gradient(
    135deg,
    rgba(231, 76, 60, 0.9) 0%,
    rgba(192, 57, 43, 0.9) 100%
  );
}

.recording-notification.start i {
  color: #ef4444;
  animation: pulse 1.5s infinite;
}

.recording-notification.stop i {
  color: #ffffff;
}

/* Extend prompt (bottom-left slide-in) */
.extend-prompt {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  transform: none;
  z-index: 2000;
  animation: extendPromptInLeft 220ms ease-out forwards;
}

.extend-content {
  background: linear-gradient(
    135deg,
    rgba(45, 45, 48, 0.96) 0%,
    rgba(32, 33, 36, 0.96) 100%
  );
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 0.875rem 1rem;
  width: 280px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(14px);
}

.extend-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 0.95rem;
}

.extend-title i {
  color: #fbbf24; /* amber-400 */
}

.extend-sub {
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
}

.extend-actions {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
}

.extend-btn {
  border: none;
  border-radius: 10px;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

.extend-btn.primary {
  background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);
  color: #fff;
}

.extend-btn.primary:hover {
  filter: brightness(1.05);
}

.extend-btn.ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.extend-btn.ghost:hover {
  background: rgba(255, 255, 255, 0.06);
}

@keyframes extendPromptInLeft {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Responsive design improvements */
@media (max-width: 1200px) {
  .controls-container {
    padding: 0.875rem;
  }

  .main-controls {
    gap: 0.875rem;
    padding: 0.625rem;
  }

  .control-btn {
    width: 52px;
    height: 52px;
  }

  .btn-icon {
    font-size: 20px;
  }

  .additional-controls {
    padding: 0 1.25rem;
  }
}

@media (max-width: 768px) {
  .controls-container {
    padding: 0.75rem;
  }

  .main-controls {
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 20px;
  }

  .control-btn {
    width: 38px;
    height: 38px;
  }

  .btn-icon {
    font-size: 18px;
  }

  .additional-controls {
    padding: 0 1rem;
    margin-top: 0.5rem;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .connection-status,
  .noise-cancellation-status,
  .status-pill {
    font-size: 0.8125rem;
    padding: 0.375rem 0.75rem;
  }

  .settings-dropdown {
    width: 280px;
    padding: 1.25rem;
    border-radius: 12px;
    right: 1rem;
    left: auto;
    bottom: calc(54px + 1rem); /* Adjust for smaller control buttons */
  }

  .setting-group select {
    font-size: 0.8125rem;
    padding: 0.625rem;
    padding-right: 2.25rem;
    background-size: 0.875em;
  }

  .setting-group select option {
    font-size: 0.8125rem;
    padding: 0.625rem;
  }
}

@media (max-width: 480px) {
  .controls-container {
    padding: 0.5rem;
  }

  .main-controls {
    gap: 0.5rem;
    padding: 0.375rem;
    border-radius: 16px;
  }

  .control-btn {
    width: 44px;
    height: 44px;
  }

  .btn-icon {
    font-size: 16px;
  }

  .additional-controls {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    padding: 0 0.5rem;
  }

  .settings-dropdown {
    width: calc(100vw - 2rem);
    max-width: 320px;
    padding: 1rem;
    border-radius: 12px;
    /* Center on mobile for better visibility */
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    bottom: calc(52px + 1rem); /* Adjust for mobile control buttons */
  }

  .setting-group {
    margin-bottom: 1rem;
  }

  .setting-group label {
    font-size: 0.8125rem;
    margin-bottom: 0.375rem;
  }

  .setting-group select {
    font-size: 0.75rem;
    padding: 0.5rem;
    padding-right: 2rem;
    background-size: 0.75em;
    background-position: right 0.5rem center;
    /* Ensure select fits container */
    min-width: 0;
    box-sizing: border-box;
  }

  .setting-group select option {
    font-size: 0.75rem;
    padding: 0.5rem;
    /* Force options to stay within bounds */
    max-width: none;
    width: 100%;
  }

  .connection-status,
  .noise-cancellation-status,
  .status-pill {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }

  .recording-notification {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    max-width: 90%;
  }
}

/* Extra small devices and landscape orientation */
@media (max-width: 360px), (max-height: 600px) and (orientation: landscape) {
  .settings-dropdown {
    width: calc(100vw - 1.5rem);
    max-width: 280px;
    padding: 0.875rem;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
  }

  .setting-group {
    margin-bottom: 0.75rem;
  }

  .setting-group label {
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
  }
}

/* Custom scrollbar for settings dropdown */
.settings-dropdown::-webkit-scrollbar {
  width: 6px;
}

.settings-dropdown::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.settings-dropdown::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.settings-dropdown::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Unread message indicator */
.unread-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.9);
  z-index: 10;
  animation: unread-pulse 2s infinite;
}

/* Animations */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes unread-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.6);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes recording-pulse {
  0%,
  100% {
    box-shadow:
      0 2px 8px rgba(229, 57, 53, 0.3),
      0 1px 3px rgba(0, 0, 0, 0.1);
  }
  50% {
    box-shadow:
      0 4px 16px rgba(229, 57, 53, 0.5),
      0 2px 6px rgba(0, 0, 0, 0.15);
  }
}

@keyframes slideDown {
  from {
    top: -60px;
    opacity: 0;
  }
  to {
    top: 2rem;
    opacity: 1;
  }
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .control-btn,
  .settings-dropdown,
  .recording-notification {
    animation: none;
    transition: none;
  }

  .control-btn:hover {
    transform: none;
  }

  .recording-btn.active {
    animation: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .controls-container {
    background: rgba(0, 0, 0, 0.9);
    border-top: 2px solid rgba(255, 255, 255, 0.5);
  }

  .main-controls {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .control-btn {
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .settings-dropdown {
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.5);
  }
}

/* Focus styles for accessibility */
.control-btn:focus {
  outline: none;
}

.setting-group select:focus,
.setting-group input[type='range']:focus {
  outline: none;
}
</style>
