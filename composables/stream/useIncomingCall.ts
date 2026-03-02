import { Call, CallingState, StreamVideoClient } from '@stream-io/video-client'

export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'offline'

export type ConnectionQuality = 'unspecified' | 'poor' | 'good' | 'excellent'

export function useIncomingCall(
  apiKey: string,
  token: string,
  user: { id: string }
) {
  const client = new StreamVideoClient({
    apiKey,
    token,
    user,
    options: { logLevel: 'warn' },
  })
  const incomingCall = ref<Call | null>(null)
  const timeoutId = ref<NodeJS.Timeout | null>(null)

  const { play: playIncoming, stop: stopIncoming } = useSound(
    '/sound/incomming.mp3',
    { loop: true }
  )

  onMounted(() => {
    client.state.calls$.subscribe(async (calls) => {
      const getCalls = calls.filter(
        (call) =>
          call.isCreatedByMe === false &&
          call.state.callingState === CallingState.RINGING
      )

      if (getCalls.length > 0) {
        if (!incomingCall.value) {
          incomingCall.value = getCalls[0]
          playIncoming()

          // Set a 30-second timeout to decline the call if not answered
          timeoutId.value = setTimeout(async () => {
            console.log('Call timed out after 30 seconds')
            await handleDeclineCall()
          }, 30000)
        }
      } else {
        if (incomingCall.value) {
          stopIncoming()
          if (timeoutId.value) clearTimeout(timeoutId.value)
          incomingCall.value = null
        }
      }
      console.log('Incoming calls', calls)
    })
  })

  // Clean up on unmount
  onBeforeUnmount(() => {
    stopIncoming()
    if (timeoutId.value) clearTimeout(timeoutId.value)
    client.disconnectUser()
  })

  const handleAcceptCall = () => {
    if (!incomingCall.value) return

    stopIncoming()
    if (timeoutId.value) clearTimeout(timeoutId.value)

    const callId = incomingCall.value.id
    const callType = incomingCall.value.type

    navigateTo({
      path: '/call',
      query: {
        callId,
        callType,
      },
    })
  }

  const handleDeclineCall = async () => {
    if (!incomingCall.value) return

    stopIncoming()
    if (timeoutId.value) clearTimeout(timeoutId.value)

    await incomingCall.value.reject()
    incomingCall.value = null
  }

  return {
    incomingCall,
    handleAcceptCall,
    handleDeclineCall,
  }
}
