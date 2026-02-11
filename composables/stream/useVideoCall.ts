import type { PreJoinDeviceSettings } from '@/types/stream/pre-join.type'
import {
  CallingState,
  StreamVideoClient,
  type StreamVideoParticipant,
} from '@stream-io/video-client'

export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'offline'

export type ConnectionQuality = 'unspecified' | 'poor' | 'good' | 'excellent'

export function useVideoCall(
  apiKey: string,
  token: string,
  user: { id: string },
  callType: string,
  callId: string,
  preJoinDeviceSettings: PreJoinDeviceSettings = {}
) {
  const client = new StreamVideoClient({
    apiKey,
    token,
    user,
    options: { logLevel: 'info' },
  })

  // Create a call instance
  const call = client.call(callType, callId)

  const error = ref<Error | null>(null)
  const callLoadError = ref<string | null>(null)
  const participants = ref<StreamVideoParticipant[]>([])
  const connectionStatus = ref<ConnectionStatus>('connected')
  const connectionQuality = ref<ConnectionQuality>('unspecified')
  const callEndTime = ref<string | undefined>(undefined)

  // Device states
  const micStatus = ref<string>('disabled')
  const cameraStatus = ref<string>('disabled')
  const screenShareStatus = ref<string>('disabled')
  const cameraDirection = ref<string>('front')
  const volume = ref<number>(0)

  const joinCall = async () => {
    try {
      await call.join()
      await setupDevices()
      connectionStatus.value = 'connected'
      callEndTime.value = call.state.custom?.endTime
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('Error joining call:', err)
    }
  }

  // Leave the call
  const leaveCall = async () => {
    try {
      connectionStatus.value = 'disconnected'
      await call.camera.disable()
      await call.microphone.disable()
      await call.leave()
    } catch (error) {
      console.error('Error leaving call:', error)
    }
  }

  // Set up connection state subscription
  const setupConnectionStateSubscription = () => {
    // Use Stream's built-in reconnection feature - 0 means try reconnecting indefinitely (default)
    call.setDisconnectionTimeout(0)

    call.state.callingState$.subscribe((callingState) => {
      console.log('Calling state changed:', callingState)

      switch (callingState) {
        case CallingState.JOINED:
          connectionStatus.value = 'connected'
          break
        case CallingState.RECONNECTING:
          connectionStatus.value = 'reconnecting'
          break
        case CallingState.OFFLINE:
          connectionStatus.value = 'offline'
          break
        case CallingState.LEFT:
          connectionStatus.value = 'disconnected'
          break
      }
    })
  }

  // Set up participants subscription
  const setupParticipantsSubscription = (
    viewportElement: HTMLElement | null
  ) => {
    if (viewportElement) {
      call.setViewport(viewportElement)
    }

    call.state.participants$.subscribe((newParticipants) => {
      participants.value = newParticipants
    })
  }

  // Set up device state subscriptions
  const setupEventSubscriptions = () => {
    // Subscribe to microphone status
    call.microphone.state.status$.subscribe((status) => {
      micStatus.value = status || 'disabled'
    })

    // Subscribe to camera status
    call.camera.state.status$.subscribe((status) => {
      cameraStatus.value = status || 'disabled'
    })

    // Subscribe to screen share status
    call.screenShare.state.status$.subscribe((status) => {
      screenShareStatus.value = status || 'disabled'
    })

    // Subscribe to camera direction (for mobile)
    call.camera.state.direction$.subscribe((direction) => {
      cameraDirection.value = direction || 'front'
    })

    // Subscribe to volume changes
    call.speaker.state.volume$.subscribe((vol) => {
      volume.value = vol || 0
    })

    call.on('call.updated', () => {
      const updatedEndTime = call.state.custom?.endTime
      if (updatedEndTime) {
        callEndTime.value = updatedEndTime
      }
    })

    call.state.participants$.subscribe((participants) => {
      participants.forEach((participant) => {
        console.log(`${participant.name}: ${participant.connectionQuality}`)

        // Track local participant's connection quality
        if (
          participant.isLocalParticipant &&
          participant.connectionQuality !== undefined
        ) {
          const quality = participant.connectionQuality
          switch (quality) {
            case 0:
              connectionQuality.value = 'unspecified'
              break
            case 1:
              connectionQuality.value = 'poor'
              break
            case 2:
              connectionQuality.value = 'good'
              break
            case 3:
              connectionQuality.value = 'excellent'
              break
            default:
              connectionQuality.value = 'unspecified'
          }
        }
      })
    })
  }

  const setupScreenShare = () => {
    call.screenShare.setSettings({
      maxFramerate: 10,
      maxBitrate: 1500000,
    })

    // Setup screen share settings
    call.screenShare.enableScreenShareAudio()
  }

  // Enable camera and microphone based on preJoinDeviceSettings
  const setupDevices = async () => {
    // Handle camera setup with error handling
    if (preJoinDeviceSettings.isCameraOn !== false) {
      try {
        call.camera.select(preJoinDeviceSettings.selectedCameraId)
        await call.camera.enable()
      } catch (cameraError) {
        console.error('Error enabling camera:', cameraError)
        // Gracefully disable camera if it fails
        await call.camera.disable()
      }
    } else {
      await call.camera.disable()
    }

    // Handle microphone setup with error handling
    if (preJoinDeviceSettings.isMicrophoneOn !== false) {
      try {
        call.microphone.select(preJoinDeviceSettings.selectedMicrophoneId)
        await call.microphone.enable()
      } catch (micError) {
        console.error('Error enabling microphone:', micError)
        // Gracefully disable microphone if it fails
        await call.microphone.disable()
      }
    } else {
      await call.microphone.disable()
    }

    if (
      preJoinDeviceSettings.selectedSpeakerId &&
      call.speaker.state.isDeviceSelectionSupported
    ) {
      try {
        call.speaker.select(preJoinDeviceSettings.selectedSpeakerId)
      } catch (speakerError) {
        console.error('Error selecting speaker device:', speakerError)
      }
    }
  }

  // Setup connection state subscription automatically
  setupConnectionStateSubscription()
  setupScreenShare()
  setupEventSubscriptions()

  // Clean up function
  const cleanup = async () => {
    connectionStatus.value = 'disconnected'
    await client.disconnectUser()
  }

  return {
    call,
    error,
    callLoadError,
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
    cleanup,
  }
}
