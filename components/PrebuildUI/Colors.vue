<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { colors } from '~/utils/colors'

// Compute colors once instead of calling `colors()` multiple times
const colorMap = computed(() => Object.entries(colors()))

// Store copied color name
const copiedColor = ref<string | null>(null)

// Function to copy color name to clipboard
const copyToClipboard = async (name: string) => {
  try {
    await navigator.clipboard.writeText(name)
    copiedColor.value = name

    // Reset copied state after 2 seconds
    setTimeout(() => {
      copiedColor.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<template>
  <div class="grid grid-cols-3 gap-3 sm:grid-cols-8 lg:grid-cols-11">
    <div
      v-for="[name, color] in colorMap"
      :key="name"
      class="relative rounded-md border p-2 w-28 aspect-square text-center flex items-center justify-center"
      :style="{ background: color }"
    >
      <!-- Copy Button -->
      <span
        class="bg-surface-card px-1 cursor-pointer text-sm rounded paragraph"
        @click="copyToClipboard(name)"
      >
        {{ name }}
      </span>

      <!-- Checkmark Icon (Shows when copied) -->
      <div
        v-if="copiedColor === name"
        class="absolute top-2 right-2 bg-white/70 text-green-600 p-1 rounded-full"
      >
        <Check :size="15" />
      </div>
    </div>
  </div>
</template>
