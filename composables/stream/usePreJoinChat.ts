import { StreamChat, type Channel } from 'stream-chat'
import { useLessonBookStore } from '~/pinia/lesson-store/lesson-book'

export const usePreJoinChat = (
  apiKey: string,
  streamToken: any,
  currentUserId: string
) => {
  // State
  const chatClient = ref<StreamChat | null>(null)
  const chatChannel = ref<Channel | null>(null)
  const unreadMessageCount = ref(0)
  const isChatConnecting = ref(true)
  const chatError = ref('')

  const lessonStore = useLessonBookStore()
  const receiverStreamId = computed(() => {
    const id = lessonStore.getLessonMeeting.teacher?.userId
    if (!id) return
    return `teacher-${id}`
  })
  //used to track messages new incoming messages
  const processedMessageIds = ref<Set<string>>(new Set())
  const isChatOpen = ref(false)

  const initializeChatClient = async () => {
    try {
      isChatConnecting.value = true
      chatError.value = ''

      if (!streamToken || !currentUserId) {
        throw new Error('No stream token or user found')
      }

      if (!chatClient.value) {
        chatClient.value = new StreamChat(apiKey)
      }

      await chatClient.value.connectUser({ id: currentUserId }, streamToken)

      await setupChatChannel()
    } catch (err) {
      console.error('Chat initialization error:', err)
      chatError.value = 'Failed to initialize chat'
    } finally {
      isChatConnecting.value = false
    }
  }

  // Setup chat channel with other participant
  const setupChatChannel = async () => {
    if (!chatClient.value || !receiverStreamId) return

    try {
      const filter = {
        type: 'messaging',
        members: { $eq: [currentUserId, receiverStreamId.value as string] },
      }

      const existingChannels = await chatClient.value.queryChannels(
        filter,
        {},
        {}
      )
      let channel

      if (existingChannels.length === 0) {
        channel = chatClient.value.channel('messaging', undefined, {
          members: [currentUserId, receiverStreamId],
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

      console.log('Successfully connected to Stream Chat')
    } catch (err) {
      console.error('Error setting up chat channel:', err)
    }
  }

  // Toggle chat visibility
  const toggleChat = async () => {
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
      chatClient.value.disconnectUser()
      chatClient.value = null
    }
  }

  watch(
    receiverStreamId,
    async () => {
      await initializeChatClient()
    },
    { immediate: true }
  )

  // Initialize on mount
  onMounted(async () => {
    await initializeChatClient()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    cleanupChat()
  })

  return {
    chatClient,
    chatChannel,

    unreadMessageCount: readonly(unreadMessageCount),
    isChatConnecting: readonly(isChatConnecting),
    chatError: readonly(chatError),
    isChatOpen,

    toggleChat,
  }
}
