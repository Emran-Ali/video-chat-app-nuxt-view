import Aura from '@primeuix/themes/aura'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css', 'primeicons/primeicons.css'],

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint',
    '@nuxtjs/color-mode',
    '@primevue/nuxt-module',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    '@nuxt/icon',
  ],

  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark',
        },
      },
    },
  },

  colorMode: {
    classSuffix: '',
    preference: 'dark',
  },

  googleFonts: {
    display: 'swap',
    families: {
      Roboto: [300, 400, 500, 700],
      Inter: [300, 400, 500, 700],
    },
  },

  app: {
    head: {
      link: [
        // 1. Legacy fallback (fixes Chrome double-download bug)
        {
          rel: 'icon',
          href: '/favicon.ico',
          sizes: '32x32',
        },
        // 2. Modern SVG (Chrome, Firefox, Edge, Safari 26+, etc.)
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicon.svg',
        },
      ],
      htmlAttrs: {
        lang: 'en',
      },
    },
  },

  runtimeConfig: {
    public: {
      BACKEND_URL: process.env.BACKEND_URL || '/api/',
      streamApiKey:
        process.env.NUXT_PUBLIC_STREAM_API_KEY || process.env.STREAM_API_KEY,
    },
  },

  imports: {
    dirs: ['pinia/**', 'composables/**'],
  },

  nitro: {
    errorHandler: '~/server/error-handler.ts',
  },

  ssr: false,
})
