// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  // Build optimizations
  build: {
    transpile: ['primevue'],
  },

  // Nitro optimizations
  nitro: {
    compressPublicAssets: true,
    minify: true,
  },
  plugins: [],
  // Vite optimizations
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            primevue: ['primevue'],
            streamClient: ['@stream-io/video-client'],
            streamChat: ['stream-chat'],
          },
        },
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
    optimizeDeps: {
      include: ['primevue'],
    },
    server: {
      allowedHosts: true,
    },
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint',
    '@nuxtjs/color-mode',
    '@primevue/nuxt-module',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    '@nuxt/icon',
    'nuxt-build-cache',
  ],
  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        {
          rel: 'preconnect',
          href: 'https://cdnjs.cloudflare.com',
          crossorigin: 'anonymous',
        },
      ],
    },
  },
  routeRules: {
    // Apply auth middleware to all routes except login and register
    '/**': { appMiddleware: ['auth'] },
  },
  icon: {
    serverBundle: {
      collections: ['pi'],
    },
  },
  imports: {
    dirs: ['pinia/**'],
  },

  css: ['~/assets/css/main.css'],
  primevue: {
    options: {
      theme: {},
    },
  },
  googleFonts: {
    display: 'swap',
    families: {
      Roboto: ['300', '400', '500', '600', '700', '800', '900'],
      Inter: ['300', '400', '500', '600', '700', '800', '900'],
    },
  },
  runtimeConfig: {
    public: {
      BACKEND_URL: process.env.BACKEND_URL || '/api/',
      streamApiKey:
        process.env.NUXT_PUBLIC_STREAM_API_KEY ||
        process.env.VITE_STREAM_API_KEY,
      appEnv: process.env.NUXT_PUBLIC_APP_ENV,
    },
  },
  ssr: false,
})
