<script setup lang="ts">
import type { Channel } from 'stream-chat'
import { onMounted } from 'vue'

const props = defineProps<{ channel: Channel; userId: string }>()
const emit = defineEmits(['back', 'toggle-sidebar'])
const userInfo = ref<any | null>(null)

const getUserInfo = (channel: Channel = props.channel) => {
  const membersArray = Object.values(channel.state.members)

  const otherMember = membersArray.find(
    (member) => member.user?.id !== props.userId
  )

  userInfo.value = {
    image: otherMember?.user?.image || undefined,
    name: otherMember?.user?.name,
    isOnline: otherMember?.user?.online || false,
    id: otherMember?.user?.id,
  }
}

const handleBack = () => {
  emit('back')
}
const handleToggleSidebar = () => {
  emit('toggle-sidebar', true)
}

watch(
  (): Channel => props.channel,
  () => getUserInfo()
)
onMounted(async () => {
  getUserInfo()
})
</script>

<template>
  <div class="flex flex-row justify-between items-center px-4 py-2.5 gap-2">
    <!-- Left: back + avatar + name -->
    <div class="flex flex-row items-center gap-3">
      <!-- Back arrow (mobile only) -->
      <button
        class="md:hidden p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        @click="handleBack"
      >
        <i class="pi pi-arrow-left text-sm" />
      </button>

      <!-- Avatar -->
      <div
        class="relative flex-shrink-0 rounded-full h-10 w-10 bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-lg"
      >
        <img
          v-if="userInfo?.image"
          :src="userInfo?.image"
          alt="User"
          class="object-cover h-10 w-10 rounded-full"
        />
        <span v-else class="font-bold text-sm text-white uppercase">
          {{ (userInfo?.name || userInfo?.id || 'U').charAt(0) }}
        </span>
        <!-- Online indicator -->
        <span
          v-if="userInfo?.isOnline"
          class="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-[#132336]"
        />
      </div>

      <!-- Name & status -->
      <div class="flex flex-col">
        <h2 class="text-sm font-bold text-white leading-tight">
          {{ userInfo?.name || userInfo?.id || 'Unnamed Channel' }}
        </h2>
        <span
          class="text-xs font-medium"
          :class="userInfo?.isOnline ? 'text-teal-400' : 'text-white/30'"
        >
          {{ userInfo?.isOnline ? '● Online' : '○ Offline' }}
        </span>
      </div>
    </div>

    <!-- Right: action icons -->
    <div class="flex flex-row items-center gap-2">
      <button
        class="w-9 h-9 flex items-center justify-center rounded-full bg-teal-400/20 text-teal-400 hover:bg-teal-500/20 hover:text-teal-500 transition-all duration-200"
        title="Video call"
      >
        <i class="pi pi-video text-sm md:text-md" />
      </button>

      <button
        class="w-9 h-9 flex items-center justify-center rounded-full bg-teal-600/20 text-teal-500 hover:bg-teal-500/20 hover:text-teal-400 transition-all duration-200"
        title="Voice call"
      >
        <i class="pi pi-phone text-sm md:text-md" />
      </button>

      <button
        class="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/20 hover:text-teal-400/50 transition-all duration-200"
        title="Shared content"
        @click="handleToggleSidebar"
      >
        <i class="pi pi-info-circle text-sm md:text-md" />
      </button>
    </div>
  </div>
</template>
