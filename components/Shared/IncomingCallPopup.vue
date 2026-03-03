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
  <Transition name="fade">
    <div
      v-if="incomingCall"
      class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <div
        class="bg-[#1a2c3d] border border-teal-500/30 rounded-3xl shadow-2xl p-6 w-full max-w-[320px] animate-in fade-in zoom-in duration-300"
      >
        <div class="flex flex-col items-center gap-4 mb-6">
          <div class="relative">
            <div
              class="w-20 h-20 rounded-full overflow-hidden bg-teal-500/20 flex items-center justify-center border-2 border-teal-500/30"
            >
              <img
                v-if="callerImage"
                :src="callerImage"
                class="w-full h-full object-cover"
              />
              <span
                v-else
                class="text-3xl font-bold text-teal-400 capitalize"
                >{{ callerName.charAt(0) }}</span
              >
            </div>
            <!-- Ring effects -->
            <div
              class="absolute inset-0 w-20 h-20 rounded-full border-2 border-teal-400/40 animate-ping opacity-25"
            ></div>
            <div
              class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-teal-500 border-4 border-[#1a2c3d] flex items-center justify-center shadow-lg"
            >
              <i
                :class="isVideo ? 'pi pi-video' : 'pi pi-phone'"
                class="text-[14px] text-white"
              ></i>
            </div>
          </div>
          <div class="text-center">
            <h3 class="text-white font-bold text-lg mb-1">{{ callerName }}</h3>
            <p class="text-teal-400/70 text-sm font-medium">
              Incoming {{ isVideo ? 'Video' : 'Voice' }} Call...
            </p>
          </div>
        </div>

        <div class="flex items-center justify-center gap-6">
          <button
            @click="declineCall"
            class="w-14 h-14 rounded-full bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all duration-200 shadow-lg shadow-red-500/20 flex items-center justify-center"
            title="Decline"
          >
            <i class="pi pi-times text-xl"></i>
          </button>
          <button
            @click="acceptCall"
            class="w-14 h-14 rounded-full bg-teal-500 text-white hover:bg-teal-600 active:scale-95 transition-all duration-200 shadow-lg shadow-teal-500/20 flex items-center justify-center"
            title="Accept"
          >
            <i
              :class="isVideo ? 'pi pi-video' : 'pi pi-phone'"
              class="text-xl"
            ></i>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
