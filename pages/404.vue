<script setup lang="ts">
useHead({
  title: '404 - Page Not Found',
  meta: [
    {
      name: 'description',
      content: 'The page you are looking for could not be found.',
    },
  ],
})

const router = useRouter()
</script>

<template>
  <div
    class="min-h-[calc(100vh-10rem)] flex items-center justify-center relative overflow-hidden"
  >
    <div class="max-w-3xl w-full text-center relative z-10 md:p-2 p-5">
      <div class="mb-6 sm:mb-8 relative">
        <h1
          class="relative text-[5rem] sm:text-8xl md:text-[9rem] lg:text-[10rem] font-black text-gray-900 dark:text-white"
        >
          404
        </h1>
      </div>

      <!-- Oops Message with Better Spacing -->
      <div class="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
        <h2
          class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white"
        >
          Oops! Page Not Found
        </h2>
        <div class="space-y-2">
          <p
            class="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 px-4"
          >
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
      </div>

      <!-- Action Buttons with Better Styling -->
      <div
        class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center"
      >
        <Button
          label="Go Back Home"
          icon="pi pi-home"
          class="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          @click="router.push('/')"
        />
        <Button
          label="Go Back"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          class="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transform hover:-translate-y-0.5 transition-all duration-200"
          @click="router.back()"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
