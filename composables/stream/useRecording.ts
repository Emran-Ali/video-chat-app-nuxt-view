import { Call } from '@stream-io/video-client'

export function useRecording(call: Call) {
  // Recording state
  const isRecording = ref<boolean>(false)
  const recordingStartTime = ref<Date | null>(null)
  const isRecordingLoading = ref<boolean>(false)

  // Recording notification system
  const recordingNotification = ref<string | null>(null)
  const recordingNotificationType = ref<'start' | 'stop' | 'error'>('start')
  const recordingNotificationTimeout = ref<number | null>(null)

  // Show notification with auto-hide after 5 seconds
  const showRecordingNotification = (
    message: string,
    type: 'start' | 'stop' | 'error' = 'start'
  ) => {
    // Clear existing timeout if there is one
    if (recordingNotificationTimeout.value) {
      clearTimeout(recordingNotificationTimeout.value)
    }

    // Set notification message and type
    recordingNotification.value = message
    recordingNotificationType.value = type

    // Auto-hide after 5 seconds
    recordingNotificationTimeout.value = window.setTimeout(() => {
      recordingNotification.value = null
    }, 5000)
  }

  // Start or stop recording
  const toggleRecording = async () => {
    if (isRecordingLoading.value) return // Prevent multiple clicks

    try {
      isRecordingLoading.value = true

      if (isRecording.value) {
        await call.stopRecording()
      } else {
        await call.startRecording()
      }

      // Note: isRecording will be updated by the subscription
    } catch (error) {
      console.error('Error toggling recording:', error)
      showRecordingNotification('Recording failed. Please try again.', 'error')
      isRecordingLoading.value = false // Reset loading state on error
    }
  }

  // Setup recording event listeners and subscription
  const setupRecordingSubscription = () => {
    // Subscribe to recording state changes
    call.state.recording$.subscribe((isActive) => {
      isRecording.value = isActive
      if (isActive && !recordingStartTime.value) {
        recordingStartTime.value = new Date()
      } else if (!isActive) {
        recordingStartTime.value = null
      }
    })

    // Setup recording event handlers
    call.on('call.recording_started', () => {
      console.log('Recording started')
      isRecordingLoading.value = false
      showRecordingNotification('Recording started', 'start')
    })

    call.on('call.recording_stopped', () => {
      console.log('Recording stopped')
      isRecordingLoading.value = false
      showRecordingNotification('Recording stopped', 'stop')
    })

    call.on('call.recording_failed', (event) => {
      console.error('Recording failed', event)
      isRecordingLoading.value = false
      showRecordingNotification('Recording failed. Please try again.', 'error')
    })
  }

  // Clean up notification timeout
  const cleanup = () => {
    if (recordingNotificationTimeout.value) {
      clearTimeout(recordingNotificationTimeout.value)
    }
  }

  // Setup subscription on composable creation
  setupRecordingSubscription()

  return {
    isRecording,
    recordingStartTime,
    isRecordingLoading,
    recordingNotification,
    recordingNotificationType,
    toggleRecording,
    showRecordingNotification,
    cleanup,
  }
}
