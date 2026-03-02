<script setup lang="ts">
import { Call } from '@stream-io/video-client'

const props = defineProps({
  incomingCall: {
    type: Call,
    required: true,
  },
})
const emit = defineEmits(['acceptCall', 'declineCall'])
const callerName = computed(() => {
  if (!props.incomingCall) return 'Unknown'
  return (
    props.incomingCall.state.createdBy?.name ||
    props.incomingCall.state.createdBy?.id ||
    'Someone'
  )
})

const callerImage = computed(() => {
  return props.incomingCall.state.createdBy?.image
})

const isVideo = computed(() => {
  return props.incomingCall.type === 'default'
})

const acceptCall = () => {
  emit('acceptCall')
}

const declineCall = () => {
  emit('declineCall')
}
</script>

<template>
  <Transition name="slide-up">
    <div v-if="incomingCall" class="fixed bottom-6 right-6 z-[999] w-80">
      <div
        class="bg-[#1a2c3d] border border-teal-500/30 rounded-2xl shadow-2xl p-4 backdrop-blur-xl"
      >
        <div class="flex items-center gap-4 mb-4">
          <div class="relative">
            <div
              class="w-16 h-16 rounded-full overflow-hidden bg-teal-500/20 flex items-center justify-center border-2 border-teal-500/30"
            >
              <img
                v-if="callerImage"
                :src="callerImage"
                class="w-full h-full object-cover"
              />
              <span
                v-else
                class="text-2xl font-bold text-teal-400 capitalize"
                >{{ callerName.charAt(0) }}</span
              >
            </div>
            <!-- Ring effects -->
            <div
              class="absolute inset-0 w-16 h-16 rounded-full border border-teal-400/40 animate-ping opacity-25"
            ></div>
            <div
              class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-500 border-2 border-[#1a2c3d] flex items-center justify-center shadow-lg"
            >
              <i
                :class="isVideo ? 'pi pi-video' : 'pi pi-phone'"
                class="text-[12px] text-white"
              ></i>
            </div>
          </div>
          <div class="flex-1">
            <h3 class="text-white font-bold text-sm">{{ callerName }}</h3>
            <p class="text-teal-400/70 text-xs">
              Incoming {{ isVideo ? 'Video' : 'Voice' }} Call...
            </p>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            @click="declineCall"
            class="flex-1 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <i class="pi pi-times"></i> Decline
          </button>
          <button
            @click="acceptCall"
            class="flex-1 py-2 rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-all duration-300 shadow-lg shadow-teal-500/20 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <i class="pi pi-check"></i> Answer
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100px);
}
</style>
