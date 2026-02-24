export default defineEventHandler((event) => {
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    message: `Endpoint ${event.path} not found`,
  })
})
