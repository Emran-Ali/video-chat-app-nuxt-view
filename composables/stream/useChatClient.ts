import type { Call } from '@stream-io/video-client'
import { StreamChat, type Channel } from 'stream-chat'

export interface Participant {
  userId: string
}

export const useChatClient = (
  apiKey: string,
  streamToken: any,
  participants: Ref<Participant[]>,
  currentUserId: string,
  call: Call
) => {
  // State
  const chatClient = ref<StreamChat | null>(null)
  const chatChannel = ref<Channel | null>(null)
  const unreadMessageCount = ref(0)
  const isChatConnecting = ref(true)
  const chatError = ref('')

  const chatReceiver = ref<Participant | null>(null)

  //used to track messages new incoming messages
  const processedMessageIds = ref<Set<string>>(new Set())
  const isChatOpen = ref(false)

  // Get the other participant for chat (exclude current user)
  const chatReceiverParticipant = computed(() => {
    if (!participants.value || participants.value.length === 0) {
      return null
    }

    // Find the first participant that is not the current user
    const otherUser = participants.value.find(
      (participant) => participant.userId !== currentUserId
    )

    return otherUser || chatReceiver.value || null
  })

  const initializeChatClient = async () => {
    try {
      isChatConnecting.value = true
      chatError.value = ''

      if (!streamToken || !currentUserId) {
        throw new Error('No stream token or user found')
      }

      console.log('Initializing StreamChat client...')

      if (!chatClient.value) {
        chatClient.value = new StreamChat(apiKey)
      }

      await chatClient.value.connectUser({ id: currentUserId }, streamToken)

      console.log('Successfully connected to Stream Chat')

      // Setup channel if we have another participant
      if (chatReceiverParticipant.value) {
        await setupChatChannel(chatReceiverParticipant.value)
      }
    } catch (err) {
      console.error('Chat initialization error:', err)
      chatError.value = 'Failed to initialize chat'
    } finally {
      isChatConnecting.value = false
    }
  }

  // Setup chat channel with other participant
  const setupChatChannel = async (participant: Participant) => {
    if (!chatClient.value || !participant) return

    try {
      const filter = {
        type: 'messaging',
        members: { $eq: [currentUserId, participant.userId] },
      }

      const existingChannels = await chatClient.value.queryChannels(
        filter,
        {},
        {}
      )
      let channel

      if (existingChannels.length === 0) {
        channel = chatClient.value.channel('messaging', undefined, {
          members: [currentUserId, participant.userId],
        })
        await channel.create()
      } else {
        channel = existingChannels[0]
      }

      chatChannel.value = channel
      await channel.watch()

      // Listen for new messages
      channel.on('message.new', (event) => {
        const message = event.message
        const isFromOtherUser = event.user?.id !== currentUserId
        const isActualMessage =
          message?.text ||
          (message?.attachments && message.attachments.length > 0)
        const isNotSystemMessage = message?.type === 'regular' || !message?.type
        const isRecentMessage =
          message?.created_at &&
          new Date(message.created_at).getTime() > Date.now() - 10000 // Only messages from last 10 seconds

        if (
          !isChatOpen.value &&
          isFromOtherUser &&
          isActualMessage &&
          isNotSystemMessage &&
          isRecentMessage &&
          message?.id
        ) {
          // Check if we've already processed this message
          if (!processedMessageIds.value.has(message.id)) {
            processedMessageIds.value.add(message.id)
            unreadMessageCount.value += 1
            console.log(
              'New unread message, count:',
              unreadMessageCount.value,
              'Message ID:',
              message.id,
              'Text:',
              message.text
            )
          }
        }
      })

      // Handle when messages are marked as read
      channel.on('message.read', () => {
        if (isChatOpen.value) {
          unreadMessageCount.value = 0
        }
      })

      // Reset unread count and processed messages for new channel setup
      unreadMessageCount.value = 0
      processedMessageIds.value.clear()
    } catch (err) {
      console.error('Error setting up chat channel:', err)
    }
  }

  // Toggle chat visibility
  const toggleChat = async () => {
    console.log('toggleChat')
    isChatOpen.value = !isChatOpen.value

    // Reset unread count and mark as read when chat is opened
    if (isChatOpen.value) {
      unreadMessageCount.value = 0
      processedMessageIds.value.clear() // Clear processed messages when opening chat
      if (chatChannel.value) {
        try {
          await chatChannel.value.markRead()
        } catch (err) {
          console.error('Error marking chat as read:', err)
        }
      }
    }
  }

  // Cleanup function
  const cleanupChat = () => {
    if (chatClient.value?.user) {
      console.log('Disconnecting StreamChat client...')
      chatClient.value.disconnectUser()
      chatClient.value = null
    }
  }

  // Watch for other participant to setup chat channel
  watch(
    chatReceiverParticipant,
    async (newParticipant) => {
      if (newParticipant && chatClient.value?.user && !chatChannel.value) {
        console.log('Other participant detected, setting up chat channel...')
        await setupChatChannel(newParticipant)
      }
    },
    { immediate: true }
  )

  const getChatReceiver = async () => {
    const callMembers = await call.queryMembers({
      limit: 100,
    })

    const chatReceiverMember = callMembers.members.find(
      (member) => member.user_id !== currentUserId
    )
    if (chatReceiverMember) {
      chatReceiver.value = { userId: chatReceiverMember.user_id }
    }
  }

  // Initialize on mount
  onMounted(async () => {
    await getChatReceiver()
    await initializeChatClient()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    cleanupChat()
  })

  return {
    // State
    chatClient,
    chatChannel,
    chatReceiverParticipant: readonly(chatReceiverParticipant),
    unreadMessageCount: readonly(unreadMessageCount),
    isChatConnecting: readonly(isChatConnecting),
    chatError: readonly(chatError),
    isChatOpen,

    toggleChat,
  }
}
