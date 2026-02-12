<script setup lang="ts">
import Toast from 'primevue/toast'

import { useTheme } from '~/themes/useTheme'

useTheme()

const authStore = useAuthStore()
</script>

<template>
  <div class="bg-white">
    <Toast />

    <SharedNavigationNav />

    <main class="pt-20">
      <slot />
    </main>

    <SharedFooter />
  </div>
</template>
