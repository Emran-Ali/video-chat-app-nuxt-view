<script setup lang="ts">
import type { ConnectionQuality } from '~/composables/stream/useVideoCall'

const props = defineProps<{
  quality: ConnectionQuality
}>()

// Compute the number of bars to show based on quality
const barCount = computed(() => {
  switch (props.quality) {
    case 'excellent':
      return 4
    case 'good':
      return 3
    case 'poor':
      return 2
    case 'unspecified':
    default:
      return 1
  }
})

// Compute the color based on quality
const qualityColor = computed(() => {
  switch (props.quality) {
    case 'excellent':
      return '#10b981' // green-500
    case 'good':
      return '#22c55e' // green-500
    case 'poor':
      return '#f59e0b' // amber-500
    case 'unspecified':
    default:
      return '#6b7280' // gray-500
  }
})

// Compute the title for accessibility
const qualityTitle = computed(() => {
  switch (props.quality) {
    case 'excellent':
      return 'Excellent connection'
    case 'good':
      return 'Good connection'
    case 'poor':
      return 'Poor connection'
    case 'unspecified':
    default:
      return 'Connection quality unknown'
  }
})
</script>

<template>
  <div
    class="connection-quality-indicator"
    :title="qualityTitle"
    role="img"
    :aria-label="qualityTitle"
  >
    <div
      v-for="bar in 4"
      :key="bar"
      class="signal-bar"
      :class="{
        active: bar <= barCount,
        'bar-1': bar === 1,
        'bar-2': bar === 2,
        'bar-3': bar === 3,
        'bar-4': bar === 4,
      }"
      :style="{
        backgroundColor:
          bar <= barCount ? qualityColor : 'rgba(255, 255, 255, 0.2)',
      }"
    />
  </div>
</template>

<style scoped>
.connection-quality-indicator {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 16px;
  width: 20px;
  padding: 2px;
}

.signal-bar {
  width: 3px;
  border-radius: 1px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: rgba(255, 255, 255, 0.2);
}

.signal-bar.bar-1 {
  height: 25%;
}

.signal-bar.bar-2 {
  height: 50%;
}

.signal-bar.bar-3 {
  height: 75%;
}

.signal-bar.bar-4 {
  height: 100%;
}

.signal-bar.active {
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
}

/* Animation for quality changes */
.signal-bar.active {
  animation: qualityPulse 0.3s ease-out;
}

@keyframes qualityPulse {
  0% {
    transform: scaleY(0.8);
    opacity: 0.7;
  }
  50% {
    transform: scaleY(1.1);
    opacity: 1;
  }
  100% {
    transform: scaleY(1);
    opacity: 1;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .signal-bar {
    animation: none;
    transition: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .signal-bar {
    border: 1px solid rgba(255, 255, 255, 0.5);
  }

  .signal-bar.active {
    border-color: currentColor;
  }
}
</style>
