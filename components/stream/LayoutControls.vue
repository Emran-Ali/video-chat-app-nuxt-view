<script setup lang="ts">
import { type StreamVideoParticipant } from '@stream-io/video-client'

const props = defineProps<{
  layoutMode: 'grid' | 'spotlight'
  effectiveLayoutMode: 'grid' | 'spotlight'
  showSidebar: boolean
  isFullScreen: boolean
  screenSharingParticipant: StreamVideoParticipant | undefined
}>()

const emit = defineEmits<{
  (e: 'toggleLayout'): void
  (e: 'toggleSidebar'): void
  (e: 'toggleFullScreen'): void
}>()
</script>

<template>
  <div class="layout-controls">
    <button
      v-if="effectiveLayoutMode === 'spotlight'"
      @click="emit('toggleSidebar')"
      class="sidebar-btn"
      title="Toggle participant sidebar"
    >
      <span v-if="showSidebar">
        <i class="pi pi-caret-right"></i>
      </span>
      <span v-else>
        <i class="pi pi-caret-left"></i>
      </span>
    </button>

    <button
      @click="emit('toggleFullScreen')"
      class="fullscreen-btn"
      :title="isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'"
    >
      <span>
        <i class="pi pi-expand"></i>
      </span>
    </button>
  </div>
</template>

<style scoped>
.layout-controls {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  display: flex;
  gap: 0.75rem;
  z-index: 30;
  border-radius: 16px;
}

.layout-controls button {
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.6) 0%,
    rgba(32, 33, 36, 0.6) 100%
  );
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
}

.layout-controls button:hover {
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(32, 33, 36, 0.8) 100%
  );
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.15);
}

.layout-controls button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.layout-controls button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  background: linear-gradient(
    135deg,
    rgba(60, 64, 67, 0.6) 0%,
    rgba(45, 45, 48, 0.6) 100%
  );
}

.layout-controls button:disabled:hover {
  transform: none;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Button specific styles */
.layout-btn {
  position: relative;
}

.layout-btn:not(:disabled):hover {
  background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);
  box-shadow:
    0 4px 16px rgba(26, 115, 232, 0.3),
    0 2px 6px rgba(0, 0, 0, 0.15);
}

.sidebar-btn:not(:disabled):hover {
  background: linear-gradient(135deg, #34a853 0%, #2d7d32 100%);
  box-shadow:
    0 4px 16px rgba(52, 168, 83, 0.3),
    0 2px 6px rgba(0, 0, 0, 0.15);
}

.fullscreen-btn:not(:disabled):hover {
  background: linear-gradient(135deg, #673ab7 0%, #512da8 100%);
  box-shadow:
    0 4px 16px rgba(103, 58, 183, 0.3),
    0 2px 6px rgba(0, 0, 0, 0.15);
}

/* Tooltip styling */
.layout-controls button::after {
  content: attr(title);
  position: absolute;
  bottom: -45px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(32, 33, 36, 0.9) 100%
  );
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  font-family:
    'Google Sans',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
}

.layout-controls button:hover::after {
  opacity: 1;
}

/* Large desktop */
@media (min-width: 1440px) {
  .layout-controls {
    top: 2rem;
    right: 2rem;
    gap: 1rem;
    border-radius: 20px;
  }

  .layout-controls button {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
}

/* Desktop */
@media (max-width: 1200px) {
  .layout-controls {
    top: 1.25rem;
    right: 1.25rem;
    gap: 0.625rem;
  }

  .layout-controls button {
    width: 34px;
    height: 34px;
    font-size: 13px;
  }
}

/* Tablet */
@media (max-width: 768px) {
  .layout-controls {
    top: 1rem;
    right: 1rem;
    gap: 0.5rem;
    border-radius: 12px;
  }

  .layout-controls button {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .layout-controls button::after {
    bottom: -40px;
    font-size: 11px;
    padding: 0.375rem 0.5rem;
    border-radius: 6px;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .layout-controls {
    top: 0.75rem;
    right: 0.75rem;
    gap: 0.375rem;
    border-radius: 8px;
  }

  .layout-controls button {
    width: 28px;
    height: 28px;
    font-size: 10px;
  }

  .layout-controls button::after {
    bottom: -35px;
    font-size: 10px;
    padding: 0.25rem 0.375rem;
    border-radius: 4px;
  }
}

/* Mobile landscape - move controls to avoid notch */
@media (max-width: 768px) and (orientation: landscape) {
  .layout-controls {
    top: 0.5rem;
    right: 0.5rem;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .layout-controls button {
    transition: none;
  }

  .layout-controls button:hover {
    transform: none;
  }

  .layout-controls button::after {
    transition: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .layout-controls {
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.5);
  }

  .layout-controls button {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .layout-controls button::after {
    background: rgba(0, 0, 0, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.5);
  }
}

/* Focus styles for accessibility */
.layout-controls button:focus {
  outline: none;
}

/* Loading state for disabled buttons */
.layout-controls button:disabled {
  position: relative;
}

.layout-controls button:disabled::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* Hide tooltips on touch devices */
@media (hover: none) {
  .layout-controls button::after {
    display: none;
  }
}

/* RTL support */
[dir='rtl'] .layout-controls {
  left: 1.5rem;
  right: auto;
}

@media (max-width: 1200px) {
  [dir='rtl'] .layout-controls {
    left: 1.25rem;
    right: auto;
  }
}

@media (max-width: 768px) {
  [dir='rtl'] .layout-controls {
    left: 1rem;
    right: auto;
  }
}

@media (max-width: 480px) {
  [dir='rtl'] .layout-controls {
    left: 0.75rem;
    right: auto;
  }
}
</style>
