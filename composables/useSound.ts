export function useSound(src: string, opts?: { volume?: number }) {
  const el = ref<HTMLAudioElement | null>(null)

  onMounted(() => {
    el.value = new Audio(src)
    el.value.preload = 'auto'
    el.value.volume = opts?.volume ?? 0.8
  })

  onBeforeUnmount(() => {
    if (!el.value) return
    el.value.pause()
    el.value.src = ''
    el.value.load()
    el.value = null
  })

  async function play() {
    if (!el.value) return
    el.value.currentTime = 0
    try {
      await el.value.play()
    } catch {
      // ignore autoplay / focus / mute errors
    }
  }

  return { play }
}
