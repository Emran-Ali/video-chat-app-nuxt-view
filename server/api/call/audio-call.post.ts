import { StreamCallService } from '~/server/utils/stream'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userId, otherUsers } = body

  if (!userId || !otherUsers.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Both userId and otherUsers are required',
    })
  }

  try {
    const callId = await StreamCallService.createAudioCall(userId, otherUsers)
    return {
      callId,
      message: 'Call created successfully',
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create video call',
    })
  }
})
