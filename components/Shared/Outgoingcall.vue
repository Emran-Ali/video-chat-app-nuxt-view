<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950"
  >
    <!-- Pulse rings -->
    <div
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <span
        class="absolute w-36 h-36 rounded-full border border-blue-400/20 animate-[ping_3s_ease-out_infinite]"
      />
      <span
        class="absolute w-52 h-52 rounded-full border border-blue-400/10 animate-[ping_3s_ease-out_0.8s_infinite]"
      />
      <span
        class="absolute w-72 h-72 rounded-full border border-blue-400/10 animate-[ping_3s_ease-out_1.6s_infinite]"
      />
    </div>

    <div class="relative flex flex-col items-center gap-6">
      <!-- Avatar -->
      <div
        class="w-32 h-32 rounded-full bg-gradient-to-br from-blue-900 to-blue-950 border border-blue-400/30 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.15)] overflow-hidden"
      >
        <img
          v-if="calleeImage"
          :src="calleeImage"
          class="w-full h-full object-cover"
        />
        <span v-else-if="calleeName" class="text-3xl font-bold text-blue-400">
          {{ calleeName.charAt(0).toUpperCase() }}
        </span>
        <i v-else class="pi pi-user w-14 h-14 text-blue-400" />
      </div>

      <!-- Info -->
      <div class="text-center">
        <p
          class="text-xs font-medium tracking-widest uppercase text-blue-400 mb-1 animate-pulse"
        >
          Calling...
        </p>
        <h2 class="text-2xl font-light text-slate-100 tracking-tight">
          {{ calleeName ?? 'Unknown' }}
        </h2>
      </div>

      <!-- End button -->
      <button
        @click="endCall"
        class="mt-2 w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center shadow-[0_4px_24px_rgba(239,68,68,0.45)] hover:scale-110 hover:shadow-[0_6px_32px_rgba(239,68,68,0.6)] active:scale-95 transition-all duration-150"
      >
        <i class="pi pi-phone-slash w-7 h-7" />
      </button>
      <span class="text-xs text-slate-500 tracking-wide">End Call</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Call } from '@stream-io/video-client'

const props = defineProps<{
  call: Call
  calleeName?: string
  calleeImage?: string
}>()

const emit = defineEmits<{
  ended: []
}>()

const { play: playCalling, stop: stopCalling } = useSound(
  '/sound/calling.mp3',
  { loop: true }
)

const timeoutId = ref<NodeJS.Timeout | null>(null)

onMounted(() => {
  playCalling()

  // Set a 30-second timeout to end the call if nobody answers
  timeoutId.value = setTimeout(() => {
    console.log('Outgoing call timed out after 30 seconds')
    endCall()
  }, 30000)
})

onBeforeUnmount(() => {
  stopCalling()
  if (timeoutId.value) clearTimeout(timeoutId.value)
})

async function endCall() {
  stopCalling()
  if (timeoutId.value) clearTimeout(timeoutId.value)
  await props.call.leave()
  emit('ended')
}
</script>
