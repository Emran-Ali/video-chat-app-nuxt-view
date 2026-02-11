<script setup lang="ts">
import type { StreamChat, Channel, Event } from 'stream-chat'
import ChatMessage from '~/components/views/Message/ChatMessage.vue'
import MessageInput from '~/components/views/Message/MessageInput.vue'

const props = defineProps<{
  client: StreamChat
  senderUserId: string
  selectedChannel: Channel | null
}>()

const selectedChannel = ref<Channel | null>(null)
const typingUsers = ref<{ [key: string]: string }>({})
const typingTimeout = ref<{ [key: string]: any }>({})
const error = ref<string | null>(null)

// Computed
const typingText = computed(() => {
  const userIds = Object.keys(typingUsers.value).filter(
    (id) => id !== props.senderUserId
  )

  if (userIds.length === 0) return ''
  if (userIds.length === 1)
    return `${typingUsers.value[userIds[0]]} is typing...`
  if (userIds.length === 2)
    return `${typingUsers.value[userIds[0]]} and ${typingUsers.value[userIds[1]]} are typing...`

  return 'Several people are typing...'
})

const selectChannel = async (channel: Channel) => {
  if (selectedChannel.value?.cid === channel.cid) return

  try {
    // Clear previous channel state
    typingUsers.value = {}
    clearAllTypingTimeouts()

    selectedChannel.value = channel
    await channel.watch()
    await channel.markRead()

    // Scroll to bottom after channel selection
    await nextTick()
  } catch (err) {
    console.error('Error selecting channel:', err)
    error.value = 'Failed to select channel'
  }
}

// Message handling
const handleSendMessage = async (payload: { text: string; files: File[] }) => {
  if (!selectedChannel.value) return

  try {
    const messageData: any = {
      text: payload.text,
    }

    // Handle multiple file attachments with progress tracking
    if (payload.files && payload.files.length > 0) {
      const attachments = []
      const totalFiles = payload.files.length
      let uploadedFiles = 0

      // Process each file sequentially
      for (const file of payload.files) {
        let type = 'file'

        // Determine file type
        if (file.type.startsWith('image/')) {
          type = 'image'
        } else if (file.type.startsWith('video/')) {
          type = 'video'
        } else if (file.type.startsWith('audio/')) {
          type = 'audio'
        }

        try {
          // Update progress (you can emit this or update a reactive variable)
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

          // Add to attachments array
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
          // Continue with other files
          continue
        }
      }

      // Only add attachments if we successfully uploaded at least one file
      if (attachments.length > 0) {
        messageData.attachments = attachments
      }

      // Show summary
      if (attachments.length !== totalFiles) {
        const failedCount = totalFiles - attachments.length
        console.warn(`${failedCount} of ${totalFiles} files failed to upload`)
      }
    }

    // Send the message with all attachments
    await selectedChannel.value.sendMessage(messageData)
    console.log('Message sent successfully with attachments')
  } catch (err) {
    console.error('Error sending message:', err)
    error.value = 'Failed to send message'
  }
}

// Typing indicators
const handleTyping = () => {
  if (!selectedChannel.value) return

  selectedChannel.value.keystroke()
  startTyping()
}

const startTyping = () => {
  if (typingTimeout.value[props.senderUserId]) {
    clearTimeout(typingTimeout.value[props.senderUserId])
  }

  typingTimeout.value[props.senderUserId] = setTimeout(() => {
    stopTyping()
  }, 3000)
}

const stopTyping = () => {
  if (!selectedChannel.value) return

  if (typingTimeout.value[props.senderUserId]) {
    clearTimeout(typingTimeout.value[props.senderUserId])
    delete typingTimeout.value[props.senderUserId]
  }

  selectedChannel.value.stopTyping()
}

const clearAllTypingTimeouts = () => {
  Object.values(typingTimeout.value).forEach((timeout) => clearTimeout(timeout))
  typingTimeout.value = {}
}

// Event handlers
const handleTypingStart = (event: Event) => {
  if (!selectedChannel.value || event.cid !== selectedChannel.value.cid) return

  const user = event.user
  // Fix: Add null check for user
  if (user && user.id !== props.senderUserId) {
    typingUsers.value = {
      ...typingUsers.value,
      [user.id]: user.name || user.id,
    }
  }
}

const handleTypingStop = (event: Event) => {
  if (!selectedChannel.value || event.cid !== selectedChannel.value.cid) return

  const user = event.user
  // Fix: Add null check for user
  if (user && user.id !== props.senderUserId && typingUsers.value[user.id]) {
    const newTypingUsers = { ...typingUsers.value }
    delete newTypingUsers[user.id]
    typingUsers.value = newTypingUsers
  }
}

const handleConnectionChanged = (event: any) => {
  if (event.online === false) {
    error.value = 'Connection lost'
  } else if (event.online === true && error.value === 'Connection lost') {
    error.value = null
  }
}

const handleSelectChannel = async () => {
  // If we have a selectedChannel prop, use it directly
  if (props.selectedChannel) {
    await selectChannel(props.selectedChannel)
  }
}

// Lifecycle
onMounted(async () => {
  console.log('Chat component mounted, initializing...')

  props.client.on('typing.start', handleTypingStart)
  props.client.on('typing.stop', handleTypingStop)
  props.client.on('connection.changed', handleConnectionChanged)

  await handleSelectChannel()
})

onUnmounted(() => {
  console.log('Chat component unmounted')
  props.client.off('typing.start', handleTypingStart)
  props.client.off('typing.stop', handleTypingStop)
  props.client.off('connection.changed', handleConnectionChanged)

  // Clear all timeouts
  clearAllTypingTimeouts()
})

// Error handling
const dismissError = () => {
  error.value = null
}
</script>

<template>
  <div class="grid grid-cols-3 gap-4 text-sm">
    <!-- Error notification -->
    <div v-if="error" class="col-span-full max-h-8">
      <div
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex justify-between items-center"
      >
        <span>{{ error }}</span>
        <button class="text-red-700 hover:text-red-900" @click="dismissError">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Chat Area -->
    <div class="rounded-xl bg-white col-span-6 flex flex-col h-[90vh]">
      <div
        v-if="!selectedChannel"
        class="flex-1 flex items-center justify-center text-gray-500"
      >
        Select a channel to start chatting
      </div>

      <!-- Messages Area - Scrollable -->
      <div
        v-else
        class="flex flex-col flex-1 min-h-0 rounded-xl bg-[#F5F9FF] p-2 border border-[#E5E7EB]"
      >
        <ChatMessage :channel="selectedChannel" />
        <div class="flex flex-col">
          <div
            v-if="typingText"
            class="text-sm text-gray-500 animate-pulse px-4 py-2"
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
