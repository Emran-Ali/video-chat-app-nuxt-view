export function useSound(
  src: string,
  opts?: { volume?: number; loop?: boolean }
) {
  const el = ref<HTMLAudioElement | null>(null)

  onMounted(() => {
    el.value = new Audio(src)
    el.value.preload = 'auto'
    el.value.volume = opts?.volume ?? 0.8
    el.value.loop = opts?.loop ?? false
  })

  onBeforeUnmount(() => {
    stop()
  })

  function stop() {
    if (!el.value) return
    el.value.pause()
    el.value.currentTime = 0
  }

  async function play() {
    if (!el.value) return
    el.value.currentTime = 0
    try {
      await el.value.play()
    } catch (e) {
      console.warn('Sound play failed', e)
    }
  }

  return { play, stop }
}
