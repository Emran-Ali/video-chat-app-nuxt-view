import {
  type StreamVideoParticipant,
  hasScreenShare,
} from '@stream-io/video-client'

export function useScreenShareNotifications(call: any) {
  const screenShareNotification = ref<string | null>(null)
  const screenShareNotificationTimeout = ref<number | null>(null)
  let screenShareSubscription: { unsubscribe: () => void } | undefined

  const showNotification = (message: string) => {
    screenShareNotification.value = message

    // Auto hide notification after 5 seconds
    if (screenShareNotificationTimeout.value) {
      clearTimeout(screenShareNotificationTimeout.value)
    }

    screenShareNotificationTimeout.value = window.setTimeout(() => {
      screenShareNotification.value = null
    }, 5000)
  }

  const setupScreenShareListener = (
    participants: Ref<StreamVideoParticipant[]>
  ) => {
    screenShareSubscription = call.screenShare.state.status$.subscribe(
      (status: string) => {
        // Find current screen sharing participant
        const currentScreenSharer = participants.value.find((p) =>
          hasScreenShare(p)
        )

        if (status === 'enabled' && currentScreenSharer) {
          // Someone started screen sharing
          const participantName =
            currentScreenSharer.name || currentScreenSharer.userId || 'Someone'
          showNotification(`${participantName} started sharing their screen`)
        } else if (status === 'disabled') {
          // Someone stopped screen sharing
          const sharer = participants.value.find((p) => hasScreenShare(p))
          if (sharer) {
            const participantName = sharer.name || sharer.userId || 'Someone'
            showNotification(`${participantName} stopped sharing their screen`)
          }
        }
      }
    )
  }

  const cleanup = () => {
    // Clear notification timeout
    if (screenShareNotificationTimeout.value) {
      clearTimeout(screenShareNotificationTimeout.value)
    }

    // Unsubscribe from screen share status
    if (screenShareSubscription) {
      screenShareSubscription.unsubscribe()
      screenShareSubscription = undefined
    }
  }

  return {
    screenShareNotification,
    setupScreenShareListener,
    cleanup,
  }
}
