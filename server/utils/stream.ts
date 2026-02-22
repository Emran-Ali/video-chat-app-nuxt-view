import { StreamClient } from '@stream-io/node-sdk'

let streamClient: StreamClient | null = null

const getStreamClient = () => {
  if (streamClient) return streamClient

  const apiKey = process.env.STREAM_API_KEY
  const apiSecret = process.env.STREAM_API_SECRET

  if (!apiKey || !apiSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stream API key or secret is not configured',
    })
  }

  streamClient = new StreamClient(apiKey, apiSecret)
  return streamClient
}

export const StreamCallService = {
  createUserToken(userId: string, expirationTime = 5 * 60 * 60 * 24) {
    try {
      const client = getStreamClient()
      return client.generateUserToken({
        user_id: userId,
        validity_in_seconds: expirationTime,
      })
    } catch (error: any) {
      console.error('Stream token generation error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create stream token',
      })
    }
  },

  async createUser(user: {
    id: string
    name: string
    role: string
    image?: string
    custom?: Record<string, any>
  }) {
    try {
      const client = getStreamClient()
      return await client.upsertUsers([user])
    } catch (error: any) {
      console.error('Stream user creation error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create user in stream',
      })
    }
  },

  async getOrCreateChatChannel(userId1: string, userId2: string) {
    try {
      const client = getStreamClient()
      const existingChannels = await client.chat.queryChannels({
        filter_conditions: {
          type: 'messaging',
          members: { $eq: [userId1, userId2] },
        },
        limit: 1,
      })

      // If channel exists, return its ID
      if (existingChannels.channels && existingChannels.channels.length > 0) {
        const existingChannelId = existingChannels.channels[0].channel?.id
        console.log(`Found existing chat channel: ${existingChannelId}`)
        return existingChannelId
      }

      // No existing channel found, create a new one
      const channelId = `chat-${userId1}-${userId2}`

      // Create the channel first
      await client.chat.getOrCreateChannel({
        type: 'messaging',
        id: channelId,
        data: {
          created_by_id: userId1,
          custom: {
            name: `Chat between ${userId1} and ${userId2}`,
          },
        },
      })

      // Add members
      await client.chat.updateChannel({
        type: 'messaging',
        id: channelId,
        add_members: [userId1, userId2] as any,
      })

      console.log(`Created new chat channel: ${channelId}`)
      return channelId
    } catch (error: any) {
      console.error(`Failed to get or create chat channel: ${error.message}`)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to get or create chat channel',
      })
    }
  },
}
