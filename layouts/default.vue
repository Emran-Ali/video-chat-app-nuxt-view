<script setup lang="ts">
import Toast from 'primevue/toast'
</script>

<template>
  <div class="h-full">
    <Toast />
    <main class="h-full">
      <slot />
    </main>
    <SharedFooter />
  </div>
</template>
