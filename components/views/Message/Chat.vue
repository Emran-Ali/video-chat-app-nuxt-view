<script setup lang="ts">
import type { Channel, Event, StreamChat } from 'stream-chat'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import ChannelList from '~/components/views/Message/ChannelList.vue'
import ChatHeader from '~/components/views/Message/ChatHeader.vue'
import ChatMessage from '~/components/views/Message/ChatMessage.vue'
import MessageInput from '~/components/views/Message/MessageInput.vue'
import SearchUser from '~/components/views/Message/SearchUser.vue'
import SharedContent from '~/components/views/Message/SharedContent.vue'

const props = defineProps<{ client: StreamChat; userId: string }>()
const route = useRoute()

const channels = ref<Channel[]>([])
const selectedChannel = ref<Channel | null>(null)
const loadingChannels = ref(true)
const typingUsers = ref<{ [key: string]: string }>({})
const typingTimeout = ref<{ [key: string]: any }>({})
const selectedUserId = ref<string | null>(null)
const error = ref<string | null>(null)
const unreadChannels = ref<boolean>(false)
const channelRefs = ref<Record<string, any>>({})

const isMobile = ref(false)
const showChatOnMobile = ref(false)
const showChatListMobile = ref(false)
const showSidebarOnMobile = ref(false)

const checkMobileView = () => {
  isMobile.value = window.innerWidth < 768 // md breakpoint
}

const toggleChatView = (show = true) => {
  showChatOnMobile.value = show
  showChatListMobile.value = !show
  showSidebarOnMobile.value = false
}

const toggleSidebar = (show = true) => {
  showSidebarOnMobile.value = show
  showChatOnMobile.value = !show
  showChatListMobile.value = false
}

console.log('showChatListMobile : ', showChatListMobile.value)
const typingText = computed(() => {
  const userIds = Object.keys(typingUsers.value).filter(
    (id) => id !== props.userId
  )

  if (userIds.length === 0) return ''
  if (userIds.length === 1)
    return `${typingUsers.value[userIds[0]]} is typing...`
  if (userIds.length === 2)
    return `${typingUsers.value[userIds[0]]} and ${typingUsers.value[userIds[1]]} are typing...`

  return 'Several people are typing...'
})

const loadChannels = async () => {
  try {
    loadingChannels.value = true
    error.value = null
    console.log('props.userId : ', props.userId)

    const filter = {
      type: 'messaging',
      members: { $in: [props.userId] },
    }
    if (unreadChannels.value) {
      filter.has_unread = true
    }
    const sort = [{ last_message_at: -1 }]
    const options = { watch: true, state: true, presence: true }

    const response = await props.client.queryChannels(filter, sort, options)

    const filterChannels = response.filter((channel) => {
      return channel.state.latestMessages.length > 0
    })
    channels.value = filterChannels

    if (response.length > 0 && !selectedChannel.value) {
      await selectChannel(response[0])
    }
  } catch (err) {
    console.error('Error loading channels:', err)
    error.value = 'Failed to load channels'
  } finally {
    loadingChannels.value = false
  }
}

const selectChannel = async (channel: Channel) => {
  if (selectedChannel.value?.cid === channel.cid) {
    toggleChatView(true)
    return
  }

  try {
    typingUsers.value = {}
    clearAllTypingTimeouts()

    selectedChannel.value = channel
    await channel.watch()
    await channel.markRead()

    if (isMobile.value) {
      toggleChatView(true)
    }

    await nextTick()

    channelRefs.value[channel.cid]?.getChannelInfo(channel)
  } catch (err) {
    console.error('Error selecting channel:', err)
    error.value = 'Failed to select channel'
  }
}

const handleUserSelected = async (user: any) => {
  try {
    const { users } = await props.client.queryUsers({ id: user.id })
    const selectedUser = users[0]

    const filter = {
      type: 'messaging',
      members: { $eq: [props.userId, user.id] },
    }

    const existingChannels = await props.client.queryChannels(filter, {}, {})
    let channel

    if (existingChannels.length === 0) {
      console.log('Creating channel: ', `chat-${props.userId}-${user.id}`)
      channel = props.client.channel(
        'messaging',
        `chat-${props.userId}-${user.id}`,
        {
          members: [props.userId, user.id],
        }
      )
      await channel.create()
    } else {
      channel = existingChannels[0]
    }

    await selectChannel(channel)
    await loadChannels()
  } catch (err) {
    console.error('Error creating or finding channel:', err)
    error.value = 'Failed to create or find channel'
  }
}

const handleSendMessage = async (payload: { text: string; files: File[] }) => {
  if (!selectedChannel.value) return

  try {
    const messageData: any = {
      text: payload.text,
    }

    if (payload.files && payload.files.length > 0) {
      const attachments = []
      const totalFiles = payload.files.length
      let uploadedFiles = 0

      for (const file of payload.files) {
        let type = 'file'

        if (file.type.startsWith('image/')) {
          type = 'image'
        } else if (file.type.startsWith('video/')) {
          type = 'video'
        } else if (file.type.startsWith('audio/')) {
          type = 'audio'
        }

        try {
          console.log(
            `Uploading file ${uploadedFiles + 1} of ${totalFiles}: ${file.name}`
          )

          let fileResponse

          // Upload file based on type
          if (type === 'image') {
            fileResponse = await selectedChannel.value.sendImage(file)
          } else {
            fileResponse = await selectedChannel.value.sendFile(file)
          }

          attachments.push({
            type: type,
            asset_url: fileResponse.file,
            thumb_url: fileResponse.file,
            name: file.name,
            file_size: file.size,
            mime_type: file.type,
          })

          uploadedFiles++
          console.log(
            `Successfully uploaded: ${file.name} (${uploadedFiles}/${totalFiles})`
          )
        } catch (fileError) {
          console.error(`Error uploading file ${file.name}:`, fileError)
          continue
        }
      }

      if (attachments.length > 0) {
        messageData.attachments = attachments
      }

      if (attachments.length !== totalFiles) {
        const failedCount = totalFiles - attachments.length
        console.warn(`${failedCount} of ${totalFiles} files failed to upload`)
      }
    }

    await selectedChannel.value.sendMessage(messageData)
    console.log('Message sent successfully with attachments')
  } catch (err) {
    console.error('Error sending message:', err)
    error.value = 'Failed to send message'
  }
}

const handleTyping = () => {
  if (!selectedChannel.value) return

  selectedChannel.value.keystroke()
  startTyping()
}

const startTyping = () => {
  if (typingTimeout.value[props.userId]) {
    clearTimeout(typingTimeout.value[props.userId])
  }

  typingTimeout.value[props.userId] = setTimeout(() => {
    stopTyping()
  }, 3000)
}

const stopTyping = () => {
  if (!selectedChannel.value) return

  if (typingTimeout.value[props.userId]) {
    clearTimeout(typingTimeout.value[props.userId])
    delete typingTimeout.value[props.userId]
  }

  selectedChannel.value.stopTyping()
}

const clearAllTypingTimeouts = () => {
  Object.values(typingTimeout.value).forEach((timeout) => clearTimeout(timeout))
  typingTimeout.value = {}
}

const handleTypingStart = (event: Event) => {
  if (!selectedChannel.value || event.cid !== selectedChannel.value.cid) return

  const user = event.user
  if (!user) return

  if (user.id !== props.userId) {
    typingUsers.value = {
      ...typingUsers.value,
      [user.id]: user.name || user.id,
    }
  }
}

const handleTypingStop = (event: Event) => {
  if (!selectedChannel.value || event.cid !== selectedChannel.value.cid) return

  const user = event.user
  if (!user) return

  if (user.id !== props.userId && typingUsers.value[user.id]) {
    const newTypingUsers = { ...typingUsers.value }
    delete newTypingUsers[user.id]
    typingUsers.value = newTypingUsers
  }
}

const handleNewMessage = (event: any) => {
  console.log('New message received:', event.message)

  if (
    selectedChannel.value?.cid !== event.cid ||
    !channels.value.some((channel) => channel.cid === event.cid)
  ) {
    loadChannels()
  }

  const cid = selectedChannel.value?.cid
  if (cid && channelRefs.value[cid]) {
    channelRefs.value[cid].getChannelInfo(selectedChannel.value)
  }
}

const handleNewMessageFromUnwatchedChannel = (event: any) => {
  loadChannels()
}

const handleConnectionChanged = (event: any) => {
  if (event.online === false) {
    error.value = 'Connection lost'
  } else if (event.online === true && error.value === 'Connection lost') {
    error.value = null
  }
}

const handleQueryUsers = async () => {
  const userId = route.query.streamUser
  if (userId) {
    await handleUserSelected({ id: userId })
  }
}

watch(
  () => unreadChannels.value,
  () => {
    loadChannels()
  }
)

onMounted(async () => {
  console.log('Chat component mounted, initializing...')
  props.client.on('message.new', handleNewMessage)
  props.client.on('typing.start', handleTypingStart)
  props.client.on('typing.stop', handleTypingStop)
  props.client.on('connection.changed', handleConnectionChanged)
  props.client.on(
    'notification.message_new',
    handleNewMessageFromUnwatchedChannel
  )

  checkMobileView()
  window.addEventListener('resize', checkMobileView)

  await loadChannels()
  await handleQueryUsers()
  console.log('Chat component initialized successfully')
})

onUnmounted(() => {
  props.client.off('message.new', handleNewMessage)
  props.client.off('typing.start', handleTypingStart)
  props.client.off('typing.stop', handleTypingStop)
  props.client.off('connection.changed', handleConnectionChanged)

  window.removeEventListener('resize', checkMobileView)

  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }

  clearAllTypingTimeouts()
})

const dismissError = () => {
  error.value = null
}
</script>

<template>
  <div
    class="grid grid-cols-1 md:grid-cols-12 gap-1 sm:gap-4 min-h-[80vh] text-xs sm:text-sm p-0"
  >
    <!-- Error notification -->
    <div v-if="error" class="col-span-full max-h-8">
      <div
        class="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded flex justify-between items-center"
      >
        <span class="text-xs sm:text-sm">{{ error }}</span>
        <button class="text-red-700 hover:text-red-900" @click="dismissError">
          <svg
            class="w-3 sm:w-4 h-3 sm:h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Channels List  -->
    <div
      v-show="showChatListMobile || !isMobile"
      class="rounded-xl border border-gray-300 bg-white flex-col h-[80vh] p-2 col-span-12 md:col-span-3 flex"
    >
      <!-- Fixed Header Section -->
      <div v-show="showChatListMobile || !isMobile" class="p-2 flex-shrink-0">
        <h2 class="text-base sm:text-lg font-bold text-gray-800">Chats</h2>

        <SearchUser
          v-model="selectedUserId"
          :client="props.client"
          class="mt-2"
          placeholder="Search user..."
          @user-selected="handleUserSelected"
        />
      </div>

      <div class="flex bg-[#F5F9FF] p-1 m-2 rounded-lg text-xs sm:text-sm">
        <div
          class="flex-1 px-2 sm:px-4 py-1 sm:py-2 text-center cursor-pointer transition-all duration-200"
          :class="
            !unreadChannels
              ? 'text-gray-900 bg-white rounded-lg shadow-sm'
              : 'text-gray-500'
          "
          @click="unreadChannels = false"
        >
          All
        </div>
        <div
          class="flex-1 px-2 sm:px-4 py-1 sm:py-2 text-center cursor-pointer transition-all duration-200"
          :class="
            unreadChannels
              ? 'text-gray-900 bg-white rounded-lg shadow-sm'
              : 'text-gray-500'
          "
          @click="unreadChannels = true"
        >
          Unread
        </div>
      </div>
      <!-- Empty State -->
      <div
        v-if="channels.length === 0"
        class="flex-1 flex items-center justify-center text-gray-500"
      >
        No chats found
      </div>

      <!-- Channels List - Scrollable -->
      <div
        v-else
        :key="Math.random() * 1000000"
        class="flex-1 overflow-y-auto p-3"
      >
        <div class="space-y-2">
          <ChannelList
            v-for="(channel, index) in channels"
            :ref="(el) => (channelRefs[channel.cid] = el)"
            :key="`${channel.cid}-${index}`"
            :channel="channel"
            :select-cannel-id="selectedChannel?.cid"
            :user-id="props.userId"
            @click="selectChannel(channel)"
          />
        </div>
      </div>
    </div>

    <!-- Main Chat Area - visible on sm+ or when in chat view on mobile -->
    <div
      v-show="showChatOnMobile || !isMobile"
      class="rounded-xl border border-gray-300 bg-white col-span-1 sm:col-span-3 md:col-span-6 flex flex-col h-[80vh]"
    >
      <!-- Channel Header - Fixed at top -->
      <ChatHeader
        v-if="selectedChannel"
        :channel="selectedChannel"
        :user-id="props.userId"
        @back="toggleChatView(false)"
        @toggle-sidebar="toggleSidebar"
      />
      <div
        v-if="!selectedChannel"
        class="flex-1 flex items-center justify-center text-gray-500 text-xs sm:text-base"
      >
        Select a channel to start chatting
      </div>

      <div
        v-else
        class="flex flex-col flex-1 min-h-0 rounded-xl bg-[#F5F9FF] m-2 sm:m-3 pt-2 md:p-2 border border-[#E5E7EB]"
      >
        <ChatMessage :channel="selectedChannel" />
        <div class="flex flex-col">
          <div
            v-if="typingText"
            class="text-xs sm:text-sm text-gray-500 animate-pulse px-2 sm:px-4 py-2"
          >
            {{ typingText }}
          </div>

          <MessageInput
            :channel="selectedChannel"
            @send-message="handleSendMessage"
            @typing="handleTyping"
            @stop-typing="stopTyping"
          />
        </div>
      </div>
    </div>

    <div
      v-show="showSidebarOnMobile || !isMobile"
      class="col-span-12 md:col-span-3 z-10 h-[80vh]"
    >
      <SharedContent
        v-if="selectedChannel"
        :channel="selectedChannel"
        :client="client"
        @toggle-sidebar="toggleSidebar"
      />
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
