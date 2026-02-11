import { StreamChat } from 'stream-chat'

export const useMessage = () => {
  const config = useRuntimeConfig()
  const apiKey = config.public.streamApiKey

  const streamStore = useStreamStore()
  const client = ref<StreamChat | null>(null)

  const streamToken = computed(() => streamStore.getStreamToken)
  const streamUserId = computed(() => streamStore.getStreamUser.id)

  const totalUnreadChannelsCount = ref(0)

  const setupMessageUnreadEvent = () => {
    client.value?.on((event) => {
      if (event.unread_channels !== undefined) {
        console.log('unread_channels', event.unread_channels)
        totalUnreadChannelsCount.value = event.unread_channels
      }
    })
  }

  const getUnreadChannelsCount = () => {
    const unreadChannelsCount = client.value?.user?.unread_channels
    totalUnreadChannelsCount.value = unreadChannelsCount
  }

  onMounted(async () => {
    try {
      // Check if we already have a connected client
      if (client.value?.user) {
        return
      }

      // Create client only once
      if (!client.value) {
        client.value = new StreamChat(apiKey)
      }

      const user = await client.value.connectUser(
        {
          id: streamUserId.value,
        },
        streamToken.value
      )

      // Get initial unread channels count
      getUnreadChannelsCount()

      // Setup message unread event for realtime update
      setupMessageUnreadEvent()

      console.log('Successfully connected to Stream Chat')
    } catch (err) {
      console.error('Stream Chat connection error:', err)
    }
  })

  onUnmounted(() => {
    if (client.value?.user) {
      client.value.disconnectUser()
      client.value = null
    }
  })

  return {
    client,
    totalUnreadChannelsCount,
  }
}
