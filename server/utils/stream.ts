import { StreamClient } from '@stream-io/node-sdk'
import { v4 as uuidv4 } from 'uuid'

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

  async getOrCreateGroupChatChannel(userIds: string[]) {
    try {
      const client = getStreamClient()
      const existingChannels = await client.chat.queryChannels({
        filter_conditions: {
          type: 'messaging',
          members: { $eq: userIds },
        },
        limit: 1,
      })

      if (existingChannels.channels && existingChannels.channels.length > 0) {
        const existingChannelId = existingChannels.channels[0].channel?.id
        console.log(`Found existing chat channel: ${existingChannelId}`)
        return existingChannelId
      }

      const channelId = `chat-group-${uuidv4()}`

      await client.chat.getOrCreateChannel({
        type: 'messaging',
        id: channelId,
        data: {
          created_by_id: userIds[0],
          custom: {
            name: `Group Chat ${channelId}`,
          },
        },
      })

      // Add members
      await client.chat.updateChannel({
        type: 'messaging',
        id: channelId,
        add_members: userIds as any,
      })

      console.log(`Created new group chat channel: ${channelId}`)
      return channelId
    } catch (error: any) {
      console.error(
        `Failed to get or create group chat channel: ${error.message}`
      )
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to get or create group chat channel',
      })
    }
  },

  async createVideoCall(userId: string, otherUsers: string[]) {
    try {
      const client = getStreamClient()
      const chatChannelId = await this.getOrCreateGroupChatChannel([
        userId,
        ...otherUsers,
      ])

      const callId = `call-${uuidv4()}`

      const call = client.video.call('default', callId)

      await call.getOrCreate({
        ring: true,
        video: true,
        data: {
          starts_at: new Date(),
          settings_override: {
            backstage: {
              enabled: false,
              join_ahead_time_seconds: 5 * 60,
            },
          },
          created_by_id: userId,
          members: [
            {
              user_id: userId,
              role: 'admin',
            },
            ...otherUsers.map((user) => ({
              user_id: user,
              role: 'call_member',
            })),
          ],
          custom: {
            createdAt: new Date().toISOString(),
            chatChannelId: chatChannelId,
          },
        },
      })

      return callId
    } catch (error: any) {
      console.error(`Failed to create video call: ${error.message}`)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create video call',
      })
    }
  },

  async createAudioCall(userId: string, otherUsers: string[]) {
    try {
      const client = getStreamClient()
      const chatChannelId = await this.getOrCreateGroupChatChannel([
        userId,
        ...otherUsers,
      ])

      const callId = `audio-call-${uuidv4()}`

      const call = client.video.call('audio_room', callId)

      await call.getOrCreate({
        ring: true,
        video: false,
        data: {
          created_by_id: userId,
          members: [
            { user_id: userId, role: 'admin' },
            ...otherUsers.map((user) => ({ user_id: user })),
          ],
          custom: {
            createdAt: new Date().toISOString(),
            chatChannelId: chatChannelId,
          },
        },
      })

      return callId
    } catch (error: any) {
      console.error(`Failed to create audio call: ${error.message}`)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create audio call',
      })
    }
  },
}
