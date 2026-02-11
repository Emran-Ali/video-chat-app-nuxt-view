import {
  hasScreenShare,
  type StreamVideoParticipant,
} from '@stream-io/video-client'

export function useCallLayout(participants: Ref<StreamVideoParticipant[]>) {
  // Layout state
  const layoutMode = ref<'grid' | 'spotlight'>('spotlight')
  const showSidebar = ref(true)
  const isFullScreen = ref(false)

  // Find a participant who is sharing their screen
  const screenSharingParticipant = computed(() => {
    return participants.value.find((participant) => hasScreenShare(participant))
  })

  // Automatically switch to spotlight mode if someone is screen sharing
  const effectiveLayoutMode = computed(() => {
    if (screenSharingParticipant.value) {
      return 'spotlight'
    }
    return layoutMode.value
  })

  // Determine the active participant for spotlight view
  const activeParticipant = computed(() => {
    // If someone is screen sharing, they're the active participant
    if (screenSharingParticipant.value) {
      return screenSharingParticipant.value
    }

    // Otherwise, prefer the first non-local participant
    const nonLocalParticipant = participants.value.find(
      (participant) => !participant.isLocalParticipant
    )
    return nonLocalParticipant ?? participants.value[0]
  })

  // Get filtered participants for the sidebar (excluding active participant in spotlight mode)
  const sidebarParticipants = computed(() => {
    if (effectiveLayoutMode.value === 'spotlight' && activeParticipant.value) {
      // Only remove active participant from sidebar if they're not screen sharing
      if (activeParticipant.value !== screenSharingParticipant.value) {
        return participants.value.filter(
          (p) => p.sessionId !== activeParticipant.value?.sessionId
        )
      }
    }
    return participants.value
  })

  // Participant count for responsive grid layout
  const participantCount = computed(() => participants.value.length)

  // Smart layout recommendations based on participant count and screen size
  const recommendedLayout = computed(() => {
    const count = participantCount.value
    const isSmallScreen = window.innerWidth < 768
    const isMediumScreen = window.innerWidth < 1200

    // Auto-switch to spotlight for many participants on smaller screens
    if (isSmallScreen && count > 4) {
      return 'spotlight'
    }

    if (isMediumScreen && count > 6) {
      return 'spotlight'
    }

    if (count > 9) {
      return 'spotlight'
    }

    return 'grid'
  })

  // Responsive sidebar visibility
  const responsiveSidebarVisibility = computed(() => {
    const isSmallScreen = window.innerWidth < 768

    // Auto-hide sidebar on small screens when there are many participants
    if (isSmallScreen && sidebarParticipants.value.length > 3) {
      return false
    }

    return showSidebar.value
  })

  // Toggle layout between grid and spotlight
  const toggleLayout = () => {
    layoutMode.value = layoutMode.value === 'grid' ? 'spotlight' : 'grid'
  }

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    showSidebar.value = !showSidebar.value
  }

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

  // Auto-adjust layout based on participant count and screen size
  const autoAdjustLayout = () => {
    const recommended = recommendedLayout.value
    if (recommended !== layoutMode.value && !screenSharingParticipant.value) {
      layoutMode.value = recommended
    }
  }

  // Setup resize listener for responsive behavior
  const setupResizeListener = () => {
    const handleResize = () => {
      autoAdjustLayout()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }

  return {
    layoutMode,
    showSidebar,
    isFullScreen,
    screenSharingParticipant,
    effectiveLayoutMode,
    activeParticipant,
    sidebarParticipants,
    participantCount,
    recommendedLayout,
    responsiveSidebarVisibility,
    toggleLayout,
    toggleSidebar,
    toggleFullScreen,
    setupFullscreenListener,
    cleanupFullscreenListener,
    autoAdjustLayout,
    setupResizeListener,
  }
}
