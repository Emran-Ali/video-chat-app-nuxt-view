<script setup lang="ts">
import { type ConnectionStatus } from '~/composables/stream/useVideoCall'

const props = defineProps<{
  type: 'connection' | 'screen-share'
  status?: ConnectionStatus
  message?: string | null
}>()

const getNotificationMessage = computed(() => {
  if (props.status === 'reconnecting') {
    return 'Reconnecting to call...'
  } else if (props.status === 'offline') {
    return 'Connection lost. Trying to reconnect...'
  }
  return ''
})
</script>

<template>
  <div
    v-if="
      type === 'connection' &&
      status !== 'connected' &&
      getNotificationMessage !== ''
    "
    class="connection-notification"
    :class="status"
  >
    {{ getNotificationMessage }}
  </div>

  <div
    v-else-if="type === 'screen-share' && message"
    class="screen-share-notification"
  >
    <i class="fas fa-desktop"></i>
    {{ message }}
  </div>
</template>

<style scoped>
/* Connection notification styling */
.connection-notification {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  color: white;
  font-weight: bold;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.connection-notification.reconnecting {
  background-color: rgba(243, 156, 18, 0.8);
  animation: pulse 1.5s infinite;
}

.connection-notification.disconnected {
  background-color: rgba(231, 76, 60, 0.8);
}

/* Screen share notification styling */
.screen-share-notification {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  color: white;
  font-weight: 500;
  z-index: 101; /* Higher than connection notification */
  backdrop-filter: blur(4px);
  background-color: rgba(26, 115, 232, 0.8);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s ease;
}

.screen-share-notification i {
  font-size: 1.1em;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -10px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

/* Responsive styles */
@media (max-width: 768px) {
  .connection-notification {
    font-size: 0.8rem;
    padding: 0.35rem 0.7rem;
  }

  .screen-share-notification {
    font-size: 0.8rem;
    padding: 0.5rem 1rem;
    max-width: 90%;
  }
}

@media (max-width: 480px) {
  .connection-notification {
    max-width: 95%;
    font-size: 0.8rem;
  }

  .screen-share-notification {
    font-size: 0.75rem;
    padding: 0.4rem 0.8rem;
    max-width: 95%;
  }
}
</style>
