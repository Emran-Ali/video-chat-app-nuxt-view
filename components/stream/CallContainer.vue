<script setup lang="ts">
import { type StreamVideoParticipant } from '@stream-io/video-client'

defineProps<{
  effectiveLayoutMode: 'grid' | 'spotlight'
  showSidebar: boolean
  activeParticipant?: StreamVideoParticipant
  screenSharingParticipant?: StreamVideoParticipant
  sidebarParticipants: StreamVideoParticipant[]
  participants: StreamVideoParticipant[]
  call: any
  isHost: boolean
}>()

const participantsRef = ref<HTMLElement | null>(null)

defineExpose({
  participantsRef,
})
</script>

<template>
  <div class="call-container" :class="effectiveLayoutMode">
    <!-- Spotlight view for screen sharing or active speaker -->
    <div v-if="effectiveLayoutMode === 'spotlight'" class="spotlight-container">
      <!-- Screen share display -->
      <div v-if="screenSharingParticipant" class="screen-share-wrapper">
        <StreamScreenShareDisplay
          :key="screenSharingParticipant.sessionId"
          :participant="screenSharingParticipant"
          :call="call"
        />
      </div>
      <!-- Active participant (if not screen sharing) -->
      <div v-else-if="activeParticipant" class="active-participant-wrapper">
        <StreamVideoParticipant
          :key="activeParticipant.sessionId"
          :participant="activeParticipant"
          :call="call"
          :is-spotlight="true"
          :is-host="isHost"
        />
      </div>
    </div>

    <!-- Participants grid or sidebar -->
    <div
      ref="participantsRef"
      class="participants-container"
      :class="{
        sidebar: effectiveLayoutMode === 'spotlight' && showSidebar,
        hidden: effectiveLayoutMode === 'spotlight' && !showSidebar,
      }"
      :data-participant-count="
        effectiveLayoutMode === 'spotlight'
          ? sidebarParticipants.length
          : participants.length
      "
    >
      <StreamVideoParticipant
        v-for="participant in effectiveLayoutMode === 'spotlight'
          ? sidebarParticipants
          : participants"
        :key="participant.sessionId"
        :participant="participant"
        :call="call"
        :is-spotlight="false"
        :is-host="isHost"
      />
    </div>
  </div>
</template>

<style scoped>
/* Main call container with modern design */
.call-container {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
  background: transparent;
  border-radius: 0;
}

/* Layout modes */
.call-container.grid {
  flex-direction: column;
  padding: 0.75rem;
}

.call-container.spotlight {
  flex-direction: row;
}

/* Smart responsive grid layout - Google Meet style */
.participants-container {
  display: grid;
  gap: 0.75rem;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;

  /* Dynamic grid based on participant count */
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  grid-auto-rows: minmax(210px, 1fr);

  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.participants-container::-webkit-scrollbar {
  width: 6px;
}

.participants-container::-webkit-scrollbar-track {
  background: transparent;
}

.participants-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.participants-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Sidebar layout for spotlight mode - Google Meet style */
.participants-container.sidebar {
  width: 25%;
  min-width: 240px;
  max-width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #181818;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 0.5rem;
  padding: 0.75rem;
  margin-left: 0.75rem;
}

.participants-container.sidebar > * {
  height: 180px;
  min-height: 140px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.participants-container.hidden {
  width: 0;
  min-width: 0;
  max-width: 0;
  padding: 0;
  overflow: hidden;
  border: none;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Spotlight container for main display */
.spotlight-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius: 16px;
  background-color: #181818;
}

.screen-share-wrapper,
.active-participant-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Dynamic grid adjustments based on participant count */
.participants-container[data-participant-count='1'] {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

.participants-container[data-participant-count='2'] {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
}

.participants-container[data-participant-count='3'],
.participants-container[data-participant-count='4'] {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.participants-container[data-participant-count='5'],
.participants-container[data-participant-count='6'] {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
}

/* Large desktop optimizations */
@media (min-width: 1440px) {
  .call-container.grid {
    padding: 1rem;
  }

  .participants-container {
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
    grid-auto-rows: minmax(400px, 1fr);
  }

  .participants-container.sidebar {
    width: 22%;
    min-width: 280px;
    max-width: 360px;
  }

  .participants-container.sidebar > * {
    height: 180px;
    min-height: 180px;
  }
}

/* Desktop responsive adjustments */
@media (max-width: 1200px) {
  .participants-container {
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    grid-auto-rows: minmax(290px, 1fr);
  }

  .participants-container.sidebar {
    width: 28%;
    min-width: 220px;
  }
}

/* Tablet landscape */
@media (max-width: 1024px) {
  .call-container.grid {
    padding: 0.5rem;
  }

  .participants-container {
    gap: 0.5rem;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    grid-auto-rows: minmax(210px, 1fr);
  }

  .participants-container.sidebar {
    width: 30%;
    min-width: 200px;
    padding: 0.5rem;
  }

  .participants-container.sidebar > * {
    height: 180px;
    min-height: 180px;
  }

  .spotlight-container {
    padding: 0.75rem;
    border-radius: 12px;
  }
}

/* Tablet portrait and mobile landscape */
@media (max-width: 768px) {
  .call-container.grid {
    padding: 0.25rem;
  }

  .call-container.spotlight {
    flex-direction: column;
    padding: 0.25rem;
  }

  .participants-container {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    grid-auto-rows: minmax(180px, 1fr);
    gap: 0.375rem;
  }

  /* Mobile sidebar becomes bottom strip */
  .participants-container.sidebar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 25%;
    min-height: 120px;
    max-width: none;
    z-index: 10;
    display: flex;
    flex-direction: row;
    gap: 0.375rem;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(20px);
    overflow-x: auto;
    overflow-y: hidden;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px 12px 0 0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .participants-container.sidebar > * {
    height: 100%;
    min-height: auto;
    width: 200px;
    min-width: 200px;
    flex-shrink: 0;
    border-radius: 8px;
  }

  .spotlight-container {
    padding: 0.5rem;
    border-radius: 8px;
  }

  /* Optimize grid for mobile */
  .participants-container[data-participant-count='1'] {
    grid-template-columns: 1fr;
  }

  .participants-container[data-participant-count='2'] {
    grid-template-columns: 1fr;
  }

  .participants-container[data-participant-count='3'],
  .participants-container[data-participant-count='4'] {
    grid-template-columns: 1fr 1fr;
  }

  /* Mobile-specific hidden state for sidebar */
  .participants-container.hidden {
    /* On mobile, hide the bottom sidebar by moving it off-screen */
    bottom: -100%;
    opacity: 0;
    height: 0;
    min-height: 0;
    transform: translateY(100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* Mobile portrait */
@media (max-width: 480px) {
  .call-container.grid {
    padding: 0.125rem;
  }

  .participants-container {
    grid-template-columns: 1fr;
    grid-auto-rows: minmax(250px, 1fr);
    gap: 0.25rem;
  }

  .participants-container[data-participant-count='2'] {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }

  .participants-container[data-participant-count='3'],
  .participants-container[data-participant-count='4'] {
    grid-template-columns: 1fr;
    grid-auto-rows: minmax(160px, 1fr);
  }

  .participants-container.sidebar {
    height: 22%;
    min-height: 100px;
    padding: 0.375rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .participants-container.sidebar > * {
    width: 200px;
    min-width: 200px;
    border-radius: 6px;
  }

  .spotlight-container {
    padding: 0.375rem;
    border-radius: 6px;
  }

  /* Mobile portrait hidden state for sidebar */
  .participants-container.hidden {
    /* On mobile portrait, hide the bottom sidebar by moving it off-screen */
    bottom: -100%;
    opacity: 0;
    height: 0;
    min-height: 0;
    transform: translateY(100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* Ultra-wide screens */
@media (min-width: 1920px) {
  .participants-container {
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    grid-auto-rows: minmax(300px, 1fr);
    gap: 1.25rem;
  }

  .participants-container.sidebar {
    width: 20%;
    min-width: 320px;
    max-width: 400px;
  }

  .participants-container.sidebar > * {
    height: 180px;
    min-height: 180px;
  }
}

/* Smooth transitions for layout changes */
.participants-container,
.participants-container.sidebar,
.spotlight-container {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Loading and empty states */
.participants-container:empty {
  display: flex;
  justify-content: center;
  align-items: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.125rem;
  font-weight: 500;
}

.participants-container:empty::after {
  content: 'Waiting for participants...';
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .participants-container,
  .participants-container.sidebar,
  .spotlight-container {
    transition: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .participants-container.sidebar {
    border-left: 2px solid rgba(255, 255, 255, 0.5);
    background: rgba(0, 0, 0, 0.3);
  }

  .spotlight-container {
    background: rgba(0, 0, 0, 0.1);
  }
}
</style>
