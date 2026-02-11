<script setup lang="ts">
defineProps({
  header: {
    type: String,
    default: 'No results found',
  },
  message: {
    type: String,
    default: 'No data found',
  },
  icon: {
    type: String,
    default: 'pi pi-search',
  },
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 w-full">
    <div
      class="bg-white dark:bg-surface-card rounded-lg shadow-md border p-8 max-w-lg w-full"
    >
      <div class="flex flex-col items-center text-center">
        <i
          :class="[icon, '!text-5xl text-gray-400 dark:text-gray-600 mb-4']"
        ></i>
        <h3 class="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">
          {{ header }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400">{{ message }}</p>
      </div>
    </div>
  </div>
</template>
