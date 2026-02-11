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
    userType: otherMember?.user?.userType,
    // isOnline: true,
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
  <div class="flex flex-row justify-between gap-2 items-center md:px-2">
    <div class="flex flex-row p-2 items-center">
      <i
        class="pi pi-arrow-left block md:!hidden mr-1 cursor-pointer text-gray-600"
        @click="handleBack"
      />
      <div
        class="relative flex-shrink-0 rounded-full h-12 w-12 bg-gray-300 flex items-center justify-center"
      >
        <img
          v-if="userInfo?.image"
          :src="getImageVersions(userInfo?.image).thumb"
          alt="User"
          class="object-cover h-8 w-8 md:h-12 md:w-12 rounded-full"
        />
        <span v-else class="font-semibold text-sm text-white">U</span>
        <span
          v-if="userInfo?.isOnline"
          class="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white"
        />
      </div>

      <div class="flex flex-col text-gray-800 px-2">
        <h2 class="text-lg md:text-xl font-bold">
          {{ userInfo?.name || userInfo?.id || 'Unnamed Channel' }}
        </h2>
        <span class="text-sm text-[#585D69]">{{ userInfo?.userType }}</span>
      </div>
    </div>
    <!-- Info button for mobile - toggles sidebar -->
    <i
      class="pi pi-info-circle md:!hidden cursor-pointer rounded-full p-2 bg-gray-100 text-sm mr-2"
      @click="handleToggleSidebar"
    />
  </div>
</template>
