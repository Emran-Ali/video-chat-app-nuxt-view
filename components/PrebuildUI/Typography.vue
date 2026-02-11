<script lang="ts" setup>
import { ref } from 'vue'
import { Check } from 'lucide-vue-next'

// Typography variants
const typoVariants = [
  'heading',
  'text_xl',
  'title',
  'paragraph',
  'paragraph_secondary',
  'paragraph_black',
  'paragraph_sm',
  'paragraph_md',
]

// Store copied class name
const copiedClass = ref<string | null>(null)

// Function to copy class name to clipboard
const copyToClipboard = async (className: string) => {
  try {
    await navigator.clipboard.writeText(className)
    copiedClass.value = className

    // Reset copied state after 2 seconds
    setTimeout(() => {
      copiedClass.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<template>
  <div>
    <div
      v-for="classes in typoVariants"
      :key="classes"
      class="py-3 border-b"
      @click="copyToClipboard(classes)"
    >
      <p :class="[classes, 'flex items-center']">
        <span
          class="px-2 py-1 mr-3 flex items-center rounded bg-primary-50 cursor-pointer relative text-sm dark:bg-surface-card"
        >
          {{ classes }}

          <Check
            v-if="copiedClass === classes"
            class="text-green-600 ml-1"
            :size="15"
          />
        </span>
        It is a long established fact that a reader will be distracted by the
        readable content.
      </p>
    </div>
  </div>
</template>
