import type { NitroErrorHandler } from 'nitropack'

export default <NitroErrorHandler>function (error, event) {
  const statusCode = error.statusCode || 500
  const statusMessage = error.statusMessage || 'Internal Server Error'
  const message = error.message || statusMessage

  event.node.res.statusCode = statusCode
  event.node.res.setHeader('Content-Type', 'application/json')
  event.node.res.end(
    JSON.stringify({
      success: false,
      statusCode,
      statusMessage,
      message,
    })
  )
}
