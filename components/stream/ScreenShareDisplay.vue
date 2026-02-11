<script setup lang="ts">
import {
  Call,
  type StreamVideoParticipant,
  hasScreenShare,
  hasScreenShareAudio,
} from '@stream-io/video-client'

const props = defineProps<{
  participant: StreamVideoParticipant
  call: Call
}>()

const screenVideoRef = ref<HTMLVideoElement | null>(null)
const screenAudioRef = ref<HTMLAudioElement | null>(null)
const isLoading = ref(true)
const isVideoReady = ref(false)

let videoUnbind: Function | undefined
let videoUntrack: Function | undefined
let audioUnbind: Function | undefined
let screenShareSubscription: { unsubscribe: () => void } | undefined

onMounted(() => {
  // Subscribe to the participant's state to detect when screen share is actually ready
  screenShareSubscription = props.call.state.participants$.subscribe(
    (participants) => {
      // Find our participant
      const currentParticipant = participants.find(
        (p) => p.sessionId === props.participant.sessionId
      )

      if (currentParticipant && currentParticipant.publishedTracks) {
        // Check if screen share is published and ready
        const hasReadyScreenShare = currentParticipant.publishedTracks.includes(
          'screenShare' as any
        )

        if (hasReadyScreenShare) {
          isLoading.value = false
          isVideoReady.value = true
        }
      }
    }
  )

  if (screenVideoRef.value && hasScreenShare(props.participant)) {
    // Track screen share element visibility
    videoUntrack = props.call.trackElementVisibility(
      screenVideoRef.value,
      props.participant.sessionId,
      'screenShareTrack'
    )

    // Bind video element to participant's screen share track
    videoUnbind = props.call.bindVideoElement(
      screenVideoRef.value,
      props.participant.sessionId,
      'screenShareTrack'
    )

    // Listen for when video actually starts playing as a backup method
    screenVideoRef.value.addEventListener('playing', () => {
      isLoading.value = false
      isVideoReady.value = true
    })

    // If the video has valid dimensions and data, it might already be playing
    if (
      screenVideoRef.value.videoWidth > 0 &&
      screenVideoRef.value.videoHeight > 0
    ) {
      isLoading.value = false
      isVideoReady.value = true
    }
  }

  // If there's screen share audio, bind it
  if (screenAudioRef.value) {
    audioUnbind = props.call.bindAudioElement(
      screenAudioRef.value,
      props.participant.sessionId,
      'screenShareAudioTrack'
    )
  }
})

// Watch for changes in the participant's screen share status
watch(
  () => hasScreenShare(props.participant),
  (hasScreen) => {
    // Reset loading state when screen share status changes
    if (hasScreen) {
      isLoading.value = true

      // If the participant is already publishing screen share, mark it as ready
      if (
        props.participant.publishedTracks &&
        props.participant.publishedTracks.includes('screenShare' as any)
      ) {
        isLoading.value = false
        isVideoReady.value = true
      }
    } else {
      isLoading.value = false
      isVideoReady.value = false
    }
  }
)

onUnmounted(() => {
  // Clean up bindings when component is unmounted
  if (videoUnbind) videoUnbind()
  if (videoUntrack) videoUntrack()
  if (audioUnbind) audioUnbind()

  // Clean up subscription
  if (screenShareSubscription) {
    screenShareSubscription.unsubscribe()
  }
})
</script>

<template>
  <div v-if="hasScreenShare(participant)" class="screen-share-container">
    <video
      ref="screenVideoRef"
      :data-session-id="participant.sessionId"
    ></video>

    <audio
      ref="screenAudioRef"
      :data-session-id="participant.sessionId"
      autoplay
      playsinline
    ></audio>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="screen-share-loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">Connecting to screen share...</div>
    </div>

    <div class="screen-share-info">
      <div class="participant-name">
        <i class="fas fa-desktop"></i>
        {{ participant.name || participant.userId }}'s Screen
      </div>
    </div>

    <div class="screen-share-indicator">
      <span>Screen sharing</span>
    </div>
  </div>
</template>

<style scoped>
.screen-share-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #000;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
}

.screen-share-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  z-index: 2;
}

.participant-name {
  color: white;
  font-size: 16px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  gap: 8px;
}

.participant-name i {
  color: #1a73e8;
}

.screen-share-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.screen-share-indicator::before {
  content: '';
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #1a73e8;
  animation: pulse 1.5s infinite;
}

/* Screen share loading styles */
.screen-share-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 3;
  color: white;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #1a73e8;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text {
  font-size: 16px;
  font-weight: 500;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

/* Responsive styling */
@media (max-width: 768px) {
  .participant-name {
    font-size: 14px;
  }

  .screen-share-indicator {
    font-size: 12px;
    padding: 4px 8px;
    top: 8px;
    right: 8px;
  }

  .loading-spinner {
    width: 36px;
    height: 36px;
    border-width: 3px;
  }

  .loading-text {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .screen-share-info {
    padding: 8px;
  }

  .participant-name {
    font-size: 12px;
  }

  .loading-spinner {
    width: 28px;
    height: 28px;
    border-width: 2px;
  }

  .loading-text {
    font-size: 12px;
  }
}
</style>
