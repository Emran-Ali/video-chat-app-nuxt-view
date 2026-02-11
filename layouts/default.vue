<script setup lang="ts">
import Toast from 'primevue/toast'

import { useTheme } from '~/themes/useTheme'

useTheme()

const authStore = useAuthStore()

const isImpersonate = computed(() => {
  return authStore.isImpersonate
})

const stopImpersonating = () => {
  authStore.stopImpersonating()
}
</script>

<template>
  <div class="bg-white">
    <Toast />

    <SharedNavigationNav />
    <div
      v-if="isImpersonate"
      class="bg-red-50 text-black sticky top-[85px] z-50 p-2 text-center border-b"
    >
      <BaseContainer class="flex justify-between items-center text-sm">
        <div>
          You are currently logged in as another user. {{}}
          <strong class="font-semibold">
            (Impersonating:
            {{ authStore.getUserFullName || 'N/A' }})
          </strong>
        </div>
        <Button
          class="p-button-xs p-button-progressive"
          @click="stopImpersonating()"
          >Return to Admin</Button
        >
      </BaseContainer>
    </div>
    <main class="pt-20">
      <slot />
    </main>

    <SharedFooter />
  </div>
</template>
