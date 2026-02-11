<script setup>
const route = useRoute()
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const token = route.query.token
    const streamToken = route.query.streamToken
    const isNew = route.query.isNew

    if (!token) {
      throw new Error('No token received')
    }

    await useAuthStore().googleSignUp(token, streamToken, isNew)
  } catch (err) {
    error.value = err.message
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center bg-gray-50">
    <BaseContainer class="w-full px-4" data-cy="login-container">
      <div
        class="max-w-[460px] w-full mx-auto bg-white p-8 sm:p-12 border rounded-2xl text-center"
      >
        <div
          v-if="loading"
          class="flex flex-col items-center text-center space-y-5"
        >
          <div class="relative h-16 w-16 flex items-center justify-center">
            <div class="absolute inset-0 rounded-full border-4 animate-ping" />

            <div
              class="absolute inset-0 rounded-full border-4 border-black border-t-transparent animate-spin"
            />

            <i class="pi pi-sign-in text-black text-3xl animate-pulse z-10"></i>
          </div>

          <h2 class="text-xl font-semibold text-gray-800">Logging you in...</h2>

          <p class="text-gray-500 text-sm leading-relaxed max-w-[280px]">
            Please wait while we verify your account and prepare your dashboard.
          </p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="space-y-5">
          <h2 class="text-xl font-semibold text-red-600">Login Failed</h2>
          <p class="text-gray-600 text-sm">{{ error }}</p>

          <NuxtLink
            to="/auth/login"
            class="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow"
          >
            Back to Login
          </NuxtLink>
        </div>
      </div>
    </BaseContainer>
  </div>
</template>
