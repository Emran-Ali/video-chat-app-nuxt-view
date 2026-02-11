// import { NoiseCancellation } from '@stream-io/audio-filters-web'
import { Call } from '@stream-io/video-client'

export function useNoiseCancellation(call: Call) {
  // Noise cancellation state
  const noiseCancellation = ref<any>(null)
  const isNoiseCancellationSupported = ref<boolean | undefined>(undefined)
  const isNoiseCancellationEnabled = ref(false)
  const noiseCancellationLevel = ref(100) // 0-100, default max suppression

  // Noise cancellation toggle function
  const toggleNoiseCancellation = async () => {
    if (!noiseCancellation.value || !isNoiseCancellationSupported.value) return

    if (isNoiseCancellationEnabled.value) {
      // Disable noise cancellation
      await call.microphone.disableNoiseCancellation()
      isNoiseCancellationEnabled.value = false
    } else {
      // Enable noise cancellation
      await call.microphone.enableNoiseCancellation(noiseCancellation.value)
      isNoiseCancellationEnabled.value = true
    }
  }

  // Initialize noise cancellation
  const initializeNoiseCancellation = async () => {
    try {
      const { NoiseCancellation } = await import(
        'https://cdn.jsdelivr.net/npm/@stream-io/audio-filters-web@0.4.2/+esm'
      )

      noiseCancellation.value = new NoiseCancellation()
      isNoiseCancellationSupported.value =
        await noiseCancellation.value.isSupported()

      if (isNoiseCancellationSupported.value) {
        await noiseCancellation.value.init()
        console.log('Noise cancellation initialized and ready to use')

        // Set up event listener for noise cancellation state changes
        noiseCancellation.value.on('change', (enabled: boolean) => {
          isNoiseCancellationEnabled.value = enabled
        })
      } else {
        console.log('Noise cancellation is not supported in this browser')
      }
    } catch (error) {
      console.error('Failed to initialize noise cancellation:', error)
      isNoiseCancellationSupported.value = false
    }
  }

  // Cleanup function
  const cleanupNoiseCancellation = () => {
    if (isNoiseCancellationEnabled.value && noiseCancellation.value) {
      call.microphone.disableNoiseCancellation()
    }
  }

  return {
    noiseCancellation,
    isNoiseCancellationSupported,
    isNoiseCancellationEnabled,
    noiseCancellationLevel,
    toggleNoiseCancellation,
    initializeNoiseCancellation,
    cleanupNoiseCancellation,
  }
}
