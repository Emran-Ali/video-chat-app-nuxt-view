import {
  hasScreenShare,
  type StreamVideoParticipant,
} from '@stream-io/video-client'

export function useCallLayout(participants: Ref<StreamVideoParticipant[]>) {
  // Layout state
  const isFullScreen = ref(false)

  // Find a participant who is sharing their screen
  const screenSharingParticipant = computed(() => {
    return participants.value.find((participant) => hasScreenShare(participant))
  })

  // The participant to be shown in full screen (background)
  // 1. If screen sharing: Screen share participant
  // 2. Otherwise: First remote participant
  // 3. Last fallback: Local participant (if alone)
  const fullScreenParticipant = computed(() => {
    if (screenSharingParticipant.value) {
      return screenSharingParticipant.value
    }

    const remoteParticipant = participants.value.find(
      (participant) => !participant.isLocalParticipant
    )
    return remoteParticipant ?? participants.value[0]
  })

  // Participants to be shown in floating popups
  // 1. If someone is sharing screen: All participants with camera enabled (including local)
  // 2. Otherwise: Only the local participant
  const floatingParticipants = computed(() => {
    if (screenSharingParticipant.value) {
      // During screen share, show EVERYONE'S camera in the popups
      return participants.value
    }

    // Default: just show local participant floating
    const local = participants.value.find((p) => p.isLocalParticipant)
    return local ? [local] : []
  })

  // Participant count for reporting if needed
  const participantCount = computed(() => participants.value.length)

  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      isFullScreen.value = true
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        isFullScreen.value = false
      }
    }
  }

  // Setup fullscreen change event listener
  const setupFullscreenListener = () => {
    const handleFullscreenChange = () => {
      isFullScreen.value = !!document.fullscreenElement
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('msfullscreenchange', handleFullscreenChange)
  }

  // Cleanup fullscreen listener
  const cleanupFullscreenListener = () => {
    const handleFullscreenChange = () => {
      isFullScreen.value = !!document.fullscreenElement
    }

    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener(
      'webkitfullscreenchange',
      handleFullscreenChange
    )
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
    document.removeEventListener('msfullscreenchange', handleFullscreenChange)
  }

  // Setup resize listener for responsive behavior
  const setupResizeListener = () => {
    // No-op for now as we removed auto-adjust
    return () => {}
  }

  return {
    isFullScreen,
    screenSharingParticipant,
    fullScreenParticipant,
    floatingParticipants,
    participantCount,
    toggleFullScreen,
    setupFullscreenListener,
    cleanupFullscreenListener,
    setupResizeListener,
  }
}
