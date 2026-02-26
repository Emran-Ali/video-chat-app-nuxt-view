<script setup lang="ts">
import type { PreJoinDeviceSettings } from '@/types/stream/pre-join.type'
import { useCallLayout } from '~/composables/stream/useCallLayout'
import { useScreenShareNotifications } from '~/composables/stream/useScreenShareNotifications'
import { useVideoCall } from '~/composables/stream/useVideoCall'
// import { useChatClient } from '~/composables/stream/useChatClient'

const props = defineProps<{
  streamUser: any
  settings: PreJoinDeviceSettings
  callId: string
  callType: string
}>()

const streamStore = useStreamStore()
const config = useRuntimeConfig()
const router = useRouter()

// API setup
const apiKey = config.public.streamApiKey
const token = computed(() => streamStore.getStreamToken)

// Initialize video call with pre-join settings
const {
  call,
  error,
  participants,
  connectionStatus,
  connectionQuality,
  micStatus,
  cameraStatus,
  screenShareStatus,
  cameraDirection,
  volume,
  callEndTime,
  joinCall,
  leaveCall,
  setupParticipantsSubscription,
  cleanup: cleanupVideoCall,
} = useVideoCall(
  apiKey,
  token.value as string,
  props.streamUser,
  props.callType,
  props.callId,
  {
    isCameraOn: props.settings.isCameraOn !== false,
    isMicrophoneOn: props.settings.isMicrophoneOn !== false,
    selectedCameraId: props.settings.selectedCameraId,
    selectedMicrophoneId: props.settings.selectedMicrophoneId,
    selectedSpeakerId: props.settings.selectedSpeakerId,
  }
)

// TODO: implement chat functionality
// const {
//   chatClient,
//   chatChannel,
//   chatReceiverParticipant,
//   unreadMessageCount,
//   isChatConnecting,
//   chatError,
//   isChatOpen,
//   toggleChat,
// } = useChatClient(apiKey, token.value, participants, props.streamUser.id, call)

// Initialize layout management
const {
  layoutMode,
  showSidebar,
  isFullScreen,
  screenSharingParticipant,
  effectiveLayoutMode,
  activeParticipant,
  sidebarParticipants,
  toggleLayout,
  toggleSidebar,
  toggleFullScreen,
  setupFullscreenListener,
  cleanupFullscreenListener,
} = useCallLayout(participants)

// Initialize screen share notifications
const {
  screenShareNotification,
  setupScreenShareListener,
  cleanup: cleanupScreenShareNotifications,
} = useScreenShareNotifications(call)

// Call container ref
const callContainerRef = ref<any>(null)
const isJoining = ref(true)

// Handle leaving call
// TODO: set warning if call duration is less than 50 min , ask if sure to leave
// take student to review page after leaving call
const handleLeaveCall = async () => {
  await leaveCall()
  router.push('/')
}

watch(connectionStatus, (newStatus) => {
  if (newStatus === 'disconnected') {
    router.push('/')
  }
})

onMounted(async () => {
  try {
    await joinCall()
    isJoining.value = false
    if (callContainerRef.value) {
      setupParticipantsSubscription(callContainerRef.value.participantsRef)
    }

    setupScreenShareListener(participants)

    setupFullscreenListener()
  } catch (error) {
    console.log(error)
  }
})

onBeforeUnmount(() => {
  cleanupVideoCall()
  cleanupFullscreenListener()
  cleanupScreenShareNotifications()
})

function getErrorMessage(error) {
  if (!error) return 'An unknown error occurred.'

  const errorMessage = error.toString()

  if (
    errorMessage.includes('JoinCall failed with error') &&
    errorMessage.includes('JoinBackstage')
  ) {
    return 'The call has not started yet. Please wait for the host to begin the session.'
  } else if (
    errorMessage.includes('JoinCall failed with error') &&
    errorMessage.includes('JoinEndedCall')
  ) {
    return 'The call has already ended. Please check the schedule for upcoming sessions.'
  }

  return 'Unable to connect to the call, please try again later.'
}
</script>

<template>
  <div
    v-if="error === null"
    :class="{
      'is-fullscreen': isFullScreen,
      'mx-auto p-4': true,
      'video-chat': true,
    }"
  >
    <!-- Notifications -->
    <StreamCallNotification type="connection" :status="connectionStatus" />
    <StreamCallNotification
      type="screen-share"
      :message="screenShareNotification || undefined"
    />
    <!-- Call Join Loading state -->
    <div v-if="isJoining" class="video-chat-loading-container">
      <div class="loader">
        <BaseLucide name="Loader" :size="64" class="animate-spin" />
      </div>
      <div class="loading-text">Joining call...</div>
    </div>
    <StreamCallContainer
      ref="callContainerRef"
      :effective-layout-mode="effectiveLayoutMode"
      :show-sidebar="showSidebar"
      :active-participant="activeParticipant"
      :screen-sharing-participant="screenSharingParticipant"
      :sidebar-participants="sidebarParticipants"
      :participants="participants"
      :call="call"
    />

    <StreamLayoutControls
      :layout-mode="layoutMode"
      :effective-layout-mode="effectiveLayoutMode"
      :show-sidebar="showSidebar"
      :is-full-screen="isFullScreen"
      :screen-sharing-participant="screenSharingParticipant"
      @toggle-layout="toggleLayout"
      @toggle-sidebar="toggleSidebar"
      @toggle-full-screen="toggleFullScreen"
    />

    <div
      v-if="connectionStatus === 'disconnected'"
      class="call-ended-container"
    ></div>

    <StreamCallControls
      :call="call"
      :connection-status="connectionStatus"
      :connection-quality="connectionQuality"
      :mic-status="micStatus"
      :camera-status="cameraStatus"
      :screen-share-status="screenShareStatus"
      :camera-direction="cameraDirection"
      :volume="volume"
      :screen-sharing-participant="screenSharingParticipant"
      :call-end-time="callEndTime"
      @leave-call="handleLeaveCall"
    />
  </div>

  <div v-else class="error-container">
    <div class="error-message">
      <p>
        {{ getErrorMessage(error) }}
      </p>
    </div>
  </div>
  <!-- <TextMessageOverlay
    v-if="chatReceiverParticipant"
    :visible="isChatOpen"
    :chat-client="chatClient"
    :chat-channel="chatChannel"
    :is-connecting="isChatConnecting"
    :error="chatError"
    @update:visible="toggleChat"
  /> -->
</template>

<style scoped>
.video-chat {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background-color: #202020;
  color: white;
  padding-bottom: 0;
  font-family:
    'Google Sans',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
}

.video-chat-loading-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(
    135deg,
    rgba(26, 26, 26, 0.95) 0%,
    rgba(45, 45, 48, 0.95) 100%
  );
  backdrop-filter: blur(20px);
  z-index: 100;
}

.loader {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.loading-text {
  font-size: 1.125rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  letter-spacing: 0.025em;
}

/* Call ended screen with professional styling */
.call-ended-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(32, 33, 36, 0.95) 100%
  );
  backdrop-filter: blur(20px);
  z-index: 50;
  padding: 2rem;
}

.call-ended-container h2 {
  font-size: 2.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: white;
  text-align: center;
  letter-spacing: -0.025em;
}

.call-ended-container p {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
  text-align: center;
}

/* Error container with modern design */
.error-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%);
  color: white;
  padding: 2rem;
}

.error-message {
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.1) 0%,
    rgba(220, 38, 38, 0.1) 100%
  );
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 2.5rem;
  border-radius: 16px;
  max-width: 90%;
  width: 100%;
  max-width: 500px;
  text-align: center;
  backdrop-filter: blur(10px);
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.3),
    0 10px 10px -5px rgba(0, 0, 0, 0.1);
}

.error-message h2 {
  font-size: 1.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #fca5a5;
}

.error-message p {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.is-fullscreen {
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
}

/* Modern recordings dialog */
.recordings-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
  padding: 1rem;
}

.recordings-dialog-content {
  background: linear-gradient(135deg, #2d2d30 0%, #3a3a3d 100%);
  color: white;
  padding: 2rem;
  border-radius: 20px;
  max-width: 95%;
  max-height: 85%;
  width: 100%;
  max-width: 700px;
  overflow: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  backdrop-filter: blur(20px);
}

.recordings-dialog h2 {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
  color: white;
  letter-spacing: -0.025em;
}

.recordings-dialog .close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.recordings-dialog .close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.close-recordings-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.875rem 2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: block;
  margin: 2rem auto 0;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.close-recordings-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
}

/* Dashboard button with modern styling */
.dashboard-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.875rem 2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  margin-top: 1.5rem;
  display: inline-block;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.dashboard-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

/* Responsive design improvements */
@media (max-width: 1024px) {
  .video-chat {
    padding: 0;
  }

  .call-ended-container h2 {
    font-size: 2rem;
  }

  .recordings-dialog-content {
    margin: 1rem;
    padding: 1.5rem;
    border-radius: 16px;
  }
}

@media (max-width: 768px) {
  .call-ended-container {
    padding: 1.5rem;
  }

  .call-ended-container h2 {
    font-size: 1.75rem;
  }

  .call-ended-container p {
    font-size: 1rem;
  }

  .error-message {
    padding: 2rem;
    border-radius: 12px;
  }

  .error-message h2 {
    font-size: 1.5rem;
  }

  .recordings-dialog-content {
    padding: 1.25rem;
    border-radius: 12px;
  }

  .recordings-dialog h2 {
    font-size: 1.5rem;
  }

  .loading-text {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .call-ended-container {
    padding: 1rem;
  }

  .call-ended-container h2 {
    font-size: 1.5rem;
  }

  .call-ended-container p {
    font-size: 0.875rem;
  }

  .error-message {
    padding: 1.5rem;
    margin: 1rem;
  }

  .error-message h2 {
    font-size: 1.25rem;
  }

  .recordings-dialog-content {
    padding: 1rem;
    margin: 0.5rem;
  }

  .dashboard-btn,
  .close-recordings-btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }
}

/* Smooth animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.video-chat-loading-container,
.call-ended-container,
.error-container {
  animation: fadeIn 0.3s ease-out;
}

/* Custom scrollbar for recordings dialog */
.recordings-dialog-content::-webkit-scrollbar {
  width: 6px;
}

.recordings-dialog-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.recordings-dialog-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.recordings-dialog-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
