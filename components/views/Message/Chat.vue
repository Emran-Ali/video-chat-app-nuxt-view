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
const authStore = useAuthStore()

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
// On mobile, show channel list by default; show chat when a channel is selected
const showChatOnMobile = ref(false)
// Sidebar (SharedContent) - always hidden by default, shown as overlay
const showSidebar = ref(false)

const checkMobileView = () => {
  isMobile.value = window.innerWidth < 768
}

const toggleChatView = (show = true) => {
  showChatOnMobile.value = show
  if (show) showSidebar.value = false
}

const toggleSidebar = (show = true) => {
  showSidebar.value = show
}

const closeSidebar = () => {
  showSidebar.value = false
}

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
    if (isMobile.value) toggleChatView(true)
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
    await props.client.queryUsers({ id: user.id })

    const filter = {
      type: 'messaging',
      members: { $eq: [props.userId, user.id] },
    }

    const existingChannels = await props.client.queryChannels(filter, {}, {})
    let channel

    if (existingChannels.length === 0) {
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
          let fileResponse

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

const handleNewMessageFromUnwatchedChannel = () => {
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

const handleLogout = async () => {
  try {
    await props.client.disconnectUser()
  } catch (err) {
    console.error('Stream disconnect error:', err)
  }
  await authStore.logout()
}

watch(
  () => unreadChannels.value,
  () => {
    loadChannels()
  }
)

onMounted(async () => {
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
  <div class="flex h-full w-full relative overflow-hidden bg-[#0d1b2a]">
    <!-- Error notification -->
    <div v-if="error" class="absolute top-2 left-0 right-0 z-50 px-4">
      <div
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg flex justify-between items-center shadow"
      >
        <span class="text-xs sm:text-sm">{{ error }}</span>
        <button
          class="text-red-700 hover:text-red-900 ml-4"
          @click="dismissError"
        >
          <i class="pi pi-times text-xs" />
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════
         CHANNEL LIST PANEL
         - Desktop: always visible, fixed width
         - Mobile: full screen, hidden when chat is open
    ═══════════════════════════════════════════════ -->
    <div
      class="channel-list-panel flex flex-col bg-[#0d1b2a] border-r border-white/5 flex-shrink-0 transition-all duration-300"
      :class="
        isMobile
          ? showChatOnMobile
            ? 'w-0 overflow-hidden'
            : 'w-full'
          : 'w-80'
      "
    >
      <!-- Header -->
      <div class="px-4 pt-5 pb-3 flex-shrink-0">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-bold text-white tracking-tight">💬 Chats</h2>
        </div>

        <SearchUser
          v-model="selectedUserId"
          :client="props.client"
          placeholder="Search user..."
          @user-selected="handleUserSelected"
        />
      </div>

      <!-- All / Unread tabs -->
      <div
        class="flex bg-white/5 p-1 mx-3 rounded-xl text-xs font-medium flex-shrink-0"
      >
        <div
          class="flex-1 px-3 py-1.5 text-center cursor-pointer rounded-lg transition-all duration-200"
          :class="
            !unreadChannels
              ? 'bg-teal-500 text-white shadow-sm font-semibold'
              : 'text-white/50 hover:text-white/80'
          "
          @click="unreadChannels = false"
        >
          All
        </div>
        <div
          class="flex-1 px-3 py-1.5 text-center cursor-pointer rounded-lg transition-all duration-200"
          :class="
            unreadChannels
              ? 'bg-teal-500 text-white shadow-sm font-semibold'
              : 'text-white/50 hover:text-white/80'
          "
          @click="unreadChannels = true"
        >
          Unread
        </div>
      </div>

      <!-- Loading state -->
      <div
        v-if="loadingChannels"
        class="flex-1 flex items-center justify-center"
      >
        <div class="flex flex-col items-center gap-2 text-teal-400">
          <div
            class="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"
          />
          <span class="text-xs text-white/40">Loading chats...</span>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="channels.length === 0"
        class="flex-1 flex flex-col items-center justify-center text-white/30 gap-2"
      >
        <i class="pi pi-comments text-3xl" />
        <span class="text-sm">No chats yet</span>
      </div>

      <!-- Channels list -->
      <div v-else class="flex-1 overflow-y-auto px-2 py-2 no-scrollbar">
        <div class="space-y-1">
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

      <!-- Logout button -->
      <div class="flex-shrink-0 px-3 py-3 border-t border-white/5">
        <button
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200"
          @click="handleLogout"
        >
          <i class="pi pi-sign-out text-sm" />
          Sign Out
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════
         MAIN CHAT AREA
         - Desktop: fills remaining space
         - Mobile: full screen when active, hidden otherwise
    ═══════════════════════════════════════════════ -->
    <div
      class="flex flex-col flex-1 min-w-0 bg-[#0f1f2d] transition-all duration-300 relative"
      :class="isMobile && !showChatOnMobile ? 'hidden' : 'flex'"
    >
      <!-- No channel selected placeholder -->
      <div
        v-if="!selectedChannel"
        class="flex-1 flex flex-col items-center justify-center text-white/20 gap-3"
      >
        <i class="pi pi-comments text-5xl" />
        <p class="text-base font-medium">
          Select a conversation to start chatting
        </p>
      </div>

      <!-- Chat with selected channel -->
      <template v-else>
        <!-- Chat Header -->
        <div class="flex-shrink-0 border-b border-white/5 bg-[#132336]">
          <ChatHeader
            :channel="selectedChannel"
            :user-id="props.userId"
            @back="toggleChatView(false)"
            @toggle-sidebar="toggleSidebar"
          />
        </div>

        <!-- Messages + Input -->
        <div
          class="flex flex-col flex-1 min-h-0 bg-[#0f1f2d] m-2 rounded-xl border border-white/5"
        >
          <ChatMessage :channel="selectedChannel" />

          <div class="flex flex-col flex-shrink-0">
            <div
              v-if="typingText"
              class="text-xs text-teal-400/70 animate-pulse px-4 py-1"
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
      </template>
    </div>

    <!-- ═══════════════════════════════════════════════
         SHARED CONTENT SIDEBAR OVERLAY
         - Slides in from the right over the chat area
         - Both desktop and mobile
    ═══════════════════════════════════════════════ -->
    <Transition name="slide-right">
      <div
        v-if="showSidebar && selectedChannel"
        class="absolute top-0 right-0 h-full z-30 flex flex-col shadow-2xl"
        :class="isMobile ? 'w-full' : 'w-80'"
      >
        <SharedContent
          :channel="selectedChannel"
          :client="client"
          @toggle-sidebar="closeSidebar"
        />
      </div>
    </Transition>

    <!-- Backdrop for sidebar on desktop -->
    <Transition name="fade">
      <div
        v-if="showSidebar && !isMobile"
        class="absolute inset-0 z-20 bg-black/10"
        @click="closeSidebar"
      />
    </Transition>
  </div>
</template>

<style scoped>
/* Slide from right */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}
.slide-right-enter-to,
.slide-right-leave-from {
  transform: translateX(0);
}

/* Backdrop fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Custom scrollbar */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
