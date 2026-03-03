<script setup lang="ts">
import {
  Call,
  type StreamVideoParticipant,
  hasAudio,
  hasVideo,
} from '@stream-io/video-client'

const props = defineProps<{
  participant: StreamVideoParticipant
  call: Call
  isSpotlight?: boolean
}>()

console.log('props.participant', props.participant)

const videoRef = ref<HTMLVideoElement | null>(null)
const audioRef = ref<HTMLAudioElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const menuOpen = ref(false)

// Check if participant has video enabled
const videoEnabled = computed(() => {
  return hasVideo(props.participant)
})

// Get first letter of participant's name for avatar
const nameInitial = computed(() => {
  const name = props.participant.name || props.participant.userId || ''
  return name.charAt(0).toUpperCase()
})

// Check if participant is local (self)
const isLocal = computed(() => {
  return props.participant.isLocalParticipant
})

// Check if participant has their mic muted
const isMuted = computed(() => {
  // Check if the participant has audio enabled
  return !hasAudio(props.participant)
})

// Extract user ID from participant for use with blockUser API
const participantUserId = computed(() => {
  return props.participant.userId
})

let videoUnbind: Function | undefined
let videoUntrack: Function | undefined
let audioUnbind: Function | undefined

// Function to remove participant from the call
// const removeParticipant = async () => {
//   try {
//     if (!isLocal.value && participantUserId.value) {
//       // Remove the participant by removing them from call members
//       await props.call.blockUser(participantUserId.value)
//       console.log(`Removed participant: ${participantUserId.value}`)
//       menuOpen.value = false
//     }
//   } catch (error) {
//     console.error('Error removing participant:', error)
//   }
// }

// Function to mute the participant
const muteParticipant = async () => {
  try {
    if (!isLocal.value && participantUserId.value) {
      // Mute the participant's audio using the available muteUser method
      await props.call.muteUser(participantUserId.value, 'audio')
      console.log(`Muted participant: ${participantUserId.value}`)
      menuOpen.value = false
    }
  } catch (error) {
    console.error('Error muting participant:', error)
  }
}

// Toggle menu open/close
const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

// Close menu when clicking outside
const closeMenu = (event: MouseEvent) => {
  if (
    menuOpen.value &&
    containerRef.value &&
    !containerRef.value.contains(event.target as Node)
  ) {
    menuOpen.value = false
  }
}

onMounted(() => {
  if (videoRef.value) {
    // Track video element visibility
    videoUntrack = props.call.trackElementVisibility(
      videoRef.value,
      props.participant.sessionId,
      'videoTrack'
    )

    // Bind video element to participant's video track
    videoUnbind = props.call.bindVideoElement(
      videoRef.value,
      props.participant.sessionId,
      'videoTrack'
    )
  }

  // Don't create audio element for local participant
  if (!props.participant.isLocalParticipant && audioRef.value) {
    audioUnbind = props.call.bindAudioElement(
      audioRef.value,
      props.participant.sessionId
    )
  }

  // Add document click listener to close menu when clicking outside
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  // Clean up bindings when component is unmounted
  if (videoUnbind) videoUnbind()
  if (videoUntrack) videoUntrack()
  if (audioUnbind) audioUnbind()

  // Remove document click listener
  document.removeEventListener('click', closeMenu)
})
</script>

<template>
  <div
    ref="containerRef"
    class="video-participant"
    :class="{
      spotlight: isSpotlight,
      local: isLocal,
    }"
  >
    <!-- Three-dot menu -->
    <div v-if="!isLocal && !isMuted" class="menu-container">
      <button class="menu-button" @click.stop="toggleMenu" title="Options">
        <i class="pi pi-ellipsis-v"></i>
      </button>
      <div v-if="menuOpen" class="menu-dropdown">
        <button v-if="!isMuted" class="menu-item" @click="muteParticipant">
          <i class="pi pi-microphone-slash"></i> Mute Participant
        </button>
      </div>
    </div>

    <div v-if="!videoEnabled" class="avatar-placeholder">
      <div class="avatar" :class="{ 'spotlight-avatar': isSpotlight }">
        {{ nameInitial }}
      </div>
    </div>

    <video
      ref="videoRef"
      :data-session-id="participant.sessionId"
      :class="{
        'video-hidden': !videoEnabled,
        'absolute inset-0 w-full h-full object-cover': true,
        '-scale-x-100': isLocal,
      }"
    ></video>

    <audio
      v-if="!participant.isLocalParticipant"
      ref="audioRef"
      :data-session-id="participant.sessionId"
    ></audio>

    <div class="participant-info">
      <div class="participant-name">
        {{ participant.name || participant.userId }}
        <span v-if="isLocal">(You)</span>
      </div>

      <div class="participant-status">
        <span v-if="isMuted" class="muted-icon" title="Microphone is muted">
          <i class="pi pi-microphone-slash"></i>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-participant {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.video-participant.spotlight {
  width: 100%;
  height: 100%;
}

/* Speaking indicator with modern design */
.speaking-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1a73e8 0%, #4285f4 100%);
  border-radius: 16px 16px 0 0;
  z-index: 3;
}

/* Participant info overlay with better design */
.participant-info {
  position: absolute;
  bottom: 12px;
  left: 0;
  right: 0;
  padding: 0 12px;

  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;

  /* backdrop-filter: blur(8px); */
}

.sidebar .participant-info {
  bottom: 0;
}

.participant-name {
  color: white;
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
  font-family:
    'Google Sans',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  letter-spacing: 0.025em;
}

.participant-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.muted-icon {
  color: white;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
  backdrop-filter: blur(4px);
}

/* Avatar with modern design */
.avatar-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  z-index: 1;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 32px;
  font-weight: 700;
  text-transform: uppercase;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  border: 3px solid rgba(255, 255, 255, 0.1);
  font-family:
    'Google Sans',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
}

.spotlight-avatar {
  width: 120px;
  height: 120px;
  font-size: 48px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  border: 4px solid rgba(255, 255, 255, 0.15);
}

/* Video element styling */
video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  border-radius: inherit;
}

.video-hidden {
  opacity: 0;
  pointer-events: none;
}

/* Modern menu styling */
.menu-container {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 4;
}

.menu-button {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.menu-button:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.05);
}

.menu-dropdown {
  position: absolute;
  top: 40px;
  left: 0;
  background: linear-gradient(135deg, #2d2d30 0%, #3a3a3d 100%);
  border-radius: 12px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
  min-width: 180px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: menuFadeIn 0.2s ease-out;
}

.menu-item {
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  background: none;
  border: none;
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background-color 0.2s ease;
  font-weight: 500;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu-item:first-child {
  border-radius: 12px 12px 0 0;
}

.menu-item:last-child {
  border-radius: 0 0 12px 12px;
}

/* Responsive design improvements */

/* when width is less than 1440px */
@media (max-width: 1440px) {
  .avatar {
    width: 70px;
    height: 70px;
    font-size: 28px;
  }

  .spotlight-avatar {
    width: 110px;
    height: 110px;
    font-size: 44px;
  }

  .participant-name {
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .video-participant {
    border-radius: 12px;
  }

  .video-participant.spotlight {
    border-radius: 8px;
    height: auto;
  }

  .participant-info {
    padding: 8px 12px;
  }

  .participant-name {
    font-size: 12px;
    max-width: 60%;
  }

  .avatar {
    width: 60px;
    height: 60px;
    font-size: 24px;
    border: 2px solid rgba(255, 255, 255, 0.1);
  }

  .spotlight-avatar {
    width: 100px;
    height: 100px;
    font-size: 36px;
    border: 3px solid rgba(255, 255, 255, 0.15);
  }

  .menu-button {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .muted-icon {
    width: 24px;
    height: 24px;
    font-size: 10px;
  }

  .menu-dropdown {
    min-width: 160px;
    border-radius: 8px;
  }

  .menu-item {
    padding: 10px 12px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .video-participant {
    border-radius: 8px;
  }

  .video-participant.spotlight {
    border-radius: 6px;
    height: auto;
  }

  .participant-info {
    padding: 6px 8px;
  }

  .participant-name {
    font-size: 11px;
    max-width: 50%;
  }

  .avatar {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }

  .spotlight-avatar {
    width: 80px;
    height: 80px;
    font-size: 28px;
  }

  .menu-button {
    width: 24px;
    height: 24px;
    font-size: 10px;
    top: 8px;
    left: 8px;
  }

  .muted-icon {
    width: 20px;
    height: 20px;
    font-size: 9px;
  }

  .menu-dropdown {
    min-width: 140px;
    border-radius: 6px;
  }

  .menu-item {
    padding: 8px 10px;
    font-size: 12px;
  }
}

/* Animations */
@keyframes speaking-pulse {
  0%,
  100% {
    box-shadow:
      0 0 0 3px rgba(26, 115, 232, 0.3),
      0 8px 32px rgba(26, 115, 232, 0.2);
  }
  50% {
    box-shadow:
      0 0 0 6px rgba(26, 115, 232, 0.2),
      0 8px 32px rgba(26, 115, 232, 0.3);
  }
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .video-participant,
  .menu-button,
  .menu-dropdown {
    animation: none;
    transition: none;
  }

  .video-participant.speaking {
    animation: none;
  }

  .video-participant:hover {
    transform: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .video-participant {
    border: 2px solid rgba(255, 255, 255, 0.8);
  }

  .video-participant.speaking {
    border-color: #4285f4;
  }

  .participant-info {
    background: rgba(0, 0, 0, 0.9);
  }

  .menu-dropdown {
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.5);
  }
}

/* Focus styles for accessibility */
.menu-button:focus,
.menu-item:focus {
  outline: none;
}

/* Loading state */
.video-participant.loading {
  background: linear-gradient(135deg, #3c4043 0%, #2d2d30 100%);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}
</style>
