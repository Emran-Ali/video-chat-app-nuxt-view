<script setup lang="ts">
import Toast from 'primevue/toast'
</script>

<template>
  <div>
    <Toast />
    <main>
      <slot />
    </main>
    <SharedFooter />
  </div>
</template>
