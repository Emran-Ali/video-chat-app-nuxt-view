export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', async (error, { event }) => {
    // We can handle global logging here if needed
    // console.error('[API Error]:', error)
  })

  // Hook into the final response to mask dev errors if preferred,
  // but using a custom error handler in defineEventHandler is more reliable for API routes.
  // However, for Nuxt 3, the best way to customize the error response globally is
  // often through an 'error.vue' or just ensuring we throw 'createError' consistently.
})
