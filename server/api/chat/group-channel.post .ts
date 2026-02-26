import { StreamCallService } from '~/server/utils/stream'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userIds } = body

  if (!userIds) {
    throw createError({
      statusCode: 400,
      statusMessage: 'UserIds are required',
    })
  }

  try {
    const channelId =
      await StreamCallService.getOrCreateGroupChatChannel(userIds)
    return {
      channelId,
      message: 'Group chat channel retrieved or created successfully',
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to manage group chat channel',
    })
  }
})
