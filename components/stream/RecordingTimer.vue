<script setup lang="ts">
const props = defineProps<{
  isRecording: boolean
  startTime?: Date | null
}>()

const recordingDuration = ref(0)
const intervalId = ref<number | null>(null)

// Format time to HH:MM:SS
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

const formattedTime = computed(() => formatTime(recordingDuration.value))

// Start/stop timer based on recording status
const startTimer = () => {
  if (intervalId.value) return // Already running

  const startTime = props.startTime || new Date()

  intervalId.value = window.setInterval(() => {
    const now = new Date()
    recordingDuration.value = Math.floor(
      (now.getTime() - startTime.getTime()) / 1000
    )
  }, 1000)
}

const stopTimer = () => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
  recordingDuration.value = 0
}

// Watch for recording status changes
watch(
  () => props.isRecording,
  (isRecording) => {
    if (isRecording) {
      startTimer()
    } else {
      stopTimer()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div v-if="isRecording" class="recording-timer">
    <div class="recording-indicator">
      <div class="recording-dot"></div>
      <span class="recording-text">REC</span>
    </div>
    <div class="timer-display">
      {{ formattedTime }}
    </div>
  </div>
</template>

<style scoped>
.recording-timer {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(
    135deg,
    rgba(220, 38, 38, 0.2) 0%,
    rgba(185, 28, 28, 0.2) 100%
  );
  backdrop-filter: blur(10px);
  padding: 8px 12px;
  border-radius: 20px;
  color: white;
  font-family:
    'Google Sans',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  font-weight: 600;
  border: 1px solid rgba(239, 68, 68, 0.3);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
  animation: slideInFromBottom 0.3s ease-out;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recording-dot {
  width: 12px;
  height: 12px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

.recording-text {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #ef4444;
}

.timer-display {
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: white;
  min-width: 60px;
  text-align: right;
}

/* Animations */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .recording-timer {
    padding: 6px 10px;
    gap: 8px;
  }

  .recording-dot {
    width: 10px;
    height: 10px;
  }

  .recording-text {
    font-size: 12px;
  }

  .timer-display {
    font-size: 14px;
    min-width: 50px;
  }
}

@media (max-width: 480px) {
  .recording-timer {
    padding: 6px 8px;
    gap: 6px;
  }

  .recording-dot {
    width: 8px;
    height: 8px;
  }

  .recording-text {
    font-size: 11px;
  }

  .timer-display {
    font-size: 12px;
    min-width: 40px;
  }
}
</style>
