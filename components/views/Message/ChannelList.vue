<script setup lang="ts">
import type { Channel } from 'stream-chat'
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  channel: Channel
  selectCannelId: string
  userId: string
}>()

const channelInfo = ref<{
  image: string | undefined
  name: string | undefined
  isOnline: boolean
  lastMessage: string | undefined
  unreadCount: number | undefined
  lastMessageAt: string | undefined
} | null>(null)

const getChannelInfo = (channel: Channel) => {
  const membersArray = Object.values(channel.state.members)
  const otherMember = membersArray.find(
    (member) => member.user?.id !== props.userId
  )

  //get latest message
  const latestMessage = channel?.state?.latestMessages.at(-1)
  const lastMessageAt = channel?.state?.last_message_at

  channelInfo.value = {
    image: otherMember?.user?.image || undefined,
    name: otherMember?.user?.name,
    lastMessageAt: getTimeDifferenceString(lastMessageAt),
    isOnline: otherMember?.user?.online || false,
    lastMessage:
      latestMessage?.text ||
      (latestMessage?.attachments?.at(-1)?.type === 'image'
        ? 'Sent Photo'
        : 'Sent an attachment'),
    unreadCount: channel?.state?.unreadCount,
  }
  return true
}
function getTimeDifferenceString(dateString: Date | null) {
  if (!dateString) return ''
  const now = new Date()
  const targetDate = new Date(dateString)

  const diffMs = now.getTime() - targetDate.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) {
    return 'Just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m`
  } else if (diffHours < 24) {
    return `${diffHours}h`
  } else {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`
  }
}

watch(
  () => props.channel,
  (newVal) => {
    getChannelInfo(newVal)
  },
  { immediate: true }
)
onMounted(async () => {
  getChannelInfo(props.channel)
})

defineExpose({ getChannelInfo })
</script>

<template>
  <div
    class="p-2.5 cursor-pointer rounded-xl transition-all duration-200"
    :class="
      props.selectCannelId === channel.cid
        ? 'bg-teal-500/15 border border-teal-500/30'
        : 'hover:bg-white/5 border border-transparent'
    "
  >
    <div class="flex flex-row gap-3 items-center">
      <!-- Avatar -->
      <div
        class="relative flex-shrink-0 rounded-full h-10 w-10 flex items-center justify-center shadow"
        :class="
          channelInfo?.isOnline
            ? 'bg-gradient-to-br from-teal-400 to-cyan-600'
            : 'bg-white/10'
        "
      >
        <img
          v-if="channelInfo?.image"
          :src="channelInfo?.image"
          alt="User"
          class="object-cover h-10 w-10 rounded-full"
        />
        <span v-else class="font-bold text-sm text-white uppercase">
          {{ (channelInfo?.name || 'U').charAt(0) }}
        </span>
        <span
          v-if="channelInfo?.isOnline"
          class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-[#0d1b2a]"
        />
      </div>

      <!-- Text content -->
      <div class="min-w-0 flex-1">
        <div class="flex justify-between items-center">
          <div
            class="truncate text-sm font-semibold"
            :class="
              props.selectCannelId === channel.cid
                ? 'text-teal-300'
                : 'text-white/80'
            "
          >
            {{ channelInfo?.name || 'Unknown' }}
          </div>
          <span class="text-xs text-white/25 flex-shrink-0 ml-1">{{
            channelInfo?.lastMessageAt
          }}</span>
        </div>
        <div class="flex justify-between items-center mt-0.5">
          <div class="text-xs text-white/35 truncate">
            {{ channelInfo?.lastMessage || '' }}
          </div>
          <span
            v-if="channelInfo?.unreadCount"
            class="text-xs bg-teal-500 rounded-full h-4 w-4 flex items-center justify-center text-white flex-shrink-0 ml-1 font-bold"
            >{{ channelInfo?.unreadCount }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>
