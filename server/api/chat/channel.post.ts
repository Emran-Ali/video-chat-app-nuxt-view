import { StreamCallService } from '~/server/utils/stream'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userId1, userId2 } = body

  if (!userId1 || !userId2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Both userId1 and userId2 are required',
    })
  }

  try {
    const channelId = await StreamCallService.getOrCreateChatChannel(
      userId1,
      userId2
    )
    return {
      channelId,
      message: 'Channel retrieved or created successfully',
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to manage chat channel',
    })
  }
})
