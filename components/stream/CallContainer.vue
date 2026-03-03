<script setup lang="ts">
import {
  hasScreenShare,
  type StreamVideoParticipant,
} from '@stream-io/video-client'

const props = defineProps<{
  fullScreenParticipant?: StreamVideoParticipant
  floatingParticipants: StreamVideoParticipant[]
  call: any
}>()

const participantsRef = ref<HTMLElement | null>(null)

defineExpose({
  participantsRef,
})

// Movable popup logic
const popupPos = ref({ x: 20, y: 20 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

const startDrag = (event: MouseEvent | TouchEvent) => {
  isDragging.value = true
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  dragOffset.value = {
    x: clientX - popupPos.value.x,
    y: clientY - popupPos.value.y,
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', stopDrag)
}

const popupWidth = 160
const popupHeight = 240

const onDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  const container = participantsRef.value
  if (!container) return

  const rect = container.getBoundingClientRect()

  // Calculate new position
  let newX = clientX - dragOffset.value.x
  let newY = clientY - dragOffset.value.y

  // Constrain to container boundaries
  newX = Math.max(10, Math.min(newX, rect.width - popupWidth - 10))
  newY = Math.max(10, Math.min(newY, rect.height - popupHeight - 10))

  popupPos.value = { x: newX, y: newY }
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}
</script>

<template>
  <div class="call-container" ref="participantsRef">
    <!-- Full Screen Layer (Background) -->
    <div class="full-screen-layer">
      <template v-if="fullScreenParticipant">
        <StreamScreenShareDisplay
          v-if="hasScreenShare(fullScreenParticipant)"
          :participant="fullScreenParticipant"
          :call="call"
        />
        <StreamVideoParticipant
          v-else
          :participant="fullScreenParticipant"
          :call="call"
          :is-spotlight="true"
        />
      </template>
      <div v-else class="waiting-state">
        <i class="pi pi-spin pi-spinner text-4xl mb-4" />
        <p>Connecting to call...</p>
      </div>
    </div>

    <!-- Floating Popups Layer -->
    <div
      class="floating-popups"
      :style="{ left: popupPos.x + 'px', top: popupPos.y + 'px' }"
      @mousedown="startDrag"
      @touchstart="startDrag"
    >
      <div
        v-for="participant in floatingParticipants"
        :key="participant.sessionId"
        class="floating-video-box"
      >
        <StreamVideoParticipant
          :participant="participant"
          :call="call"
          :is-spotlight="false"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.call-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: #101010;
}

.full-screen-layer {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.waiting-state {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: rgba(255, 255, 255, 0.4);
}

.floating-popups {
  position: absolute;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: move;
  pointer-events: auto;
  transition: transform 0.1s ease-out;
}

.floating-video-box {
  width: 160px;
  height: 240px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  border: 2px solid rgba(255, 255, 255, 0.15);
  background: #1a1a1a;
  flex-shrink: 0;
}

.floating-video-box :deep(.video-participant) {
  width: 100%;
  height: 100%;
}

@media (max-width: 768px) {
  .floating-video-box {
    width: 110px;
    height: 165px;
  }
}
</style>
