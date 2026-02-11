import { Call } from '@stream-io/video-client'
import type { StreamVideoEvent } from '@stream-io/video-client'

export function useHostPresenceTracking(
  call: Call,
  user: { id: string },
  callId: string
) {
  const streamStore = useStreamStore()

  const callLoadError = ref<string | null>(null)
  const isHostPresent = ref<boolean>(false)

  const isHost = computed(() => user.id.startsWith('teacher'))

  console.log('isHost', isHost.value)

  const loadCall = async () => {
    try {
      callLoadError.value = null
      await call.get()
    } catch (error) {
      console.error('Error loading call:', error)
      callLoadError.value = 'Teacher is not online. Please try again later.'
    }
  }

  const checkInitialHostPresence = async () => {
    try {
      // TODO: Remove this on production
      if (callId.includes('admin-test-call')) {
        isHostPresent.value = true
        return
      }

      if (!isHost.value) {
        const lessonId = callId.split('-')[1]
        const hostOnlineStatus = await streamStore.isHostOnline(lessonId)

        if (hostOnlineStatus && hostOnlineStatus.isHostOnline) {
          isHostPresent.value = true
          console.log('Host confirmed online via API - enabling join button')
        }
      }
    } catch (error) {
      console.error('Error checking initial host presence:', error)
    }
  }

  // Set up host presence tracking
  const setupHostPresenceTracking = async () => {
    // Run initial check
    await checkInitialHostPresence()

    call.on('call.session_participant_joined', (event: StreamVideoEvent) => {
      if (event.type === 'call.session_participant_joined') {
        const participant = event.participant
        console.log('participant_joined', participant)

        if (participant.user.id.startsWith('teacher')) {
          isHostPresent.value = true
          console.log('Host joined - enabling join button')
        }
      }
    })

    call.on('call.session_participant_left', (event: StreamVideoEvent) => {
      if (event.type === 'call.session_participant_left') {
        const participant = event.participant
        console.log('participant_left', participant)

        if (participant.user.id.startsWith('teacher')) {
          isHostPresent.value = false
          console.log('Host left - disabling join button')
        }
      }
    })
  }

  onMounted(async () => {
    try {
      await loadCall()
      setupHostPresenceTracking()
    } catch (error) {
      console.error('Error loading call:', error)
    }
  })

  return {
    loadCall,
    callLoadError,
    isHost,
    isHostPresent,
    setupHostPresenceTracking,
  }
}
