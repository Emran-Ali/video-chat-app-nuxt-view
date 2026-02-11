<script setup lang="ts">
import { ref, computed } from 'vue'
import moment from 'moment'
import ChatInputField from '~/components/Shared/ChatBox/ChatInputField.vue'

// Define props for the component
interface Message {
  id: number
  text: string
  timestamp: string
  isOutgoing: boolean
}

interface User {
  id: number
  name: string
  imageUrl: string
  skills: string[]
  isVerified: boolean
  countryFlag?: boolean
}

interface Props {
  currentUser: User
  otherUser: User
  messages: Message[]
}

const props = defineProps<Props>()

// Format timestamps using moment
const formatTime = (timestamp: string): string => {
  return moment(timestamp).format('h:mm A')
}

// Computed property for formatted skills list
const skillsList = computed(() => {
  return props.currentUser.skills.join(', ')
})
</script>

<template>
  <div class="max-w-[637px] rounded-lg p-6 shadow">
    <!-- User profile header -->
    <div class="flex items-center gap-3 mb-12">
      <div
        class="w-14 h-14 rounded-full overflow-hidden relative aspect-square"
      >
        <img
          :src="getImageVersions(currentUser.imageUrl).thumb"
          :alt="`${currentUser.name} profile image`"
          class="w-full h-full object-cover"
        />
      </div>

      <div>
        <div class="flex items-center gap-2 flex-wrap">
          <h2 class="title">{{ currentUser.name }}</h2>
          <BaseGlobalIcon
            v-if="currentUser.isVerified"
            class="text-blue-500"
            component-name="BadgeIcon"
          />

          <!-- Country flag - conditionally rendered -->
          <svg
            v-if="currentUser.countryFlag"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="14"
            viewBox="0 0 18 14"
            fill="none"
          >
            <g clip-path="url(#clip0_239_26529)">
              <path d="M1 1H17.0008V13H1V1Z" fill="#222222" />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M1 1H19.0187V4H1V1Z"
                fill="#FFFF00"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M1 4H19.0187V7H1V4Z"
                fill="white"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M1 7H19.0187V10H1V7Z"
                fill="#BE0027"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M1 10H19.0187V13H1V10Z"
                fill="#3B5AA3"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M1 1V13L9.95078 7.01641L1 1Z"
                fill="#239E46"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M4.68441 4.31413C2.69222 4.21335 1.78051 5.80242 1.78285 7.03054C1.77816 8.48367 3.15629 9.67898 4.4266 9.60866C3.74222 9.28523 2.90316 8.37351 2.89847 7.02351C2.89144 5.80242 3.58988 4.73835 4.68676 4.31413H4.68441Z"
                fill="white"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M4.65627 5.61724L4.37502 5.39927L4.03284 5.50708L4.15471 5.16958L3.94846 4.87896L4.30471 4.89302L4.51565 4.60474L4.61643 4.94927L4.95393 5.06177L4.65862 5.26099L4.65627 5.61724ZM4.64924 6.83833L4.36799 6.61802L4.02581 6.72583L4.15002 6.39067L3.94143 6.10005L4.30002 6.11177L4.51096 5.82583L4.6094 6.16802L4.94924 6.28286L4.65159 6.48208L4.64924 6.83833ZM4.65393 8.07114L4.37268 7.85083L4.03284 7.95864L4.15471 7.62349L3.94846 7.33286L4.30471 7.34458L4.51565 7.05864L4.61643 7.40083L4.95393 7.51333L4.65862 7.71489L4.65393 8.07114ZM4.64924 9.31333L4.36799 9.09536L4.02346 9.20317L4.14768 8.86567L3.93909 8.57505L4.29768 8.58911L4.50862 8.30083L4.60706 8.64536L4.9469 8.75786L4.64924 8.95708V9.31333Z"
                fill="white"
              />
            </g>
            <rect x="0.5" y="0.5" width="17" height="13" stroke="#EAEAEA" />
            <defs>
              <clipPath id="clip0_239_26529">
                <rect x="1" y="1" width="16" height="12" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>

        <p class="paragraph_secondary mt-1">{{ skillsList }}</p>
      </div>
    </div>

    <!-- Chat container -->
    <div
      class="border rounded-lg bg-[#F5F9FF] dark:bg-surface-section p-3 sm:p-6"
    >
      <!-- Message bubbles -->
      <div
        v-for="message in messages"
        :key="message.id"
        :class="[
          'flex items-end gap-4 my-12',
          message.isOutgoing ? 'justify-end' : 'flex-row-reverse justify-end',
        ]"
      >
        <p class="paragraph_secondary">{{ formatTime(message.timestamp) }}</p>

        <div class="flex items-start gap-4">
          <!-- Avatar is on the right for outgoing messages, left for incoming -->
          <template v-if="!message.isOutgoing">
            <div
              class="w-10 h-10 rounded-full overflow-hidden relative aspect-square"
            >
              <img
                :src="getImageVersions(otherUser.imageUrl).thumb"
                :alt="`${otherUser.name} profile image`"
                class="w-full h-full object-cover"
              />
            </div>
          </template>

          <!-- Message bubble -->
          <div
            :class="[
              'py-2 px-4 rounded-2xl font-normal',
              message.isOutgoing
                ? 'rounded-tr-none bg-primary text-white'
                : 'rounded-tl-none bg-surface-section border max-w-[357px]',
            ]"
          >
            {{ message.text }}
          </div>

          <!-- Avatar is on the right for outgoing messages -->
          <template v-if="message.isOutgoing">
            <div
              class="w-10 h-10 rounded-full overflow-hidden relative aspect-square"
            >
              <img
                :src="getImageVersions(currentUser.imageUrl).thumb"
                :alt="`${currentUser.name} profile image`"
                class="w-full h-full object-cover"
              />
            </div>
          </template>
        </div>
      </div>
      <ChatInputField />
    </div>
  </div>
</template>
