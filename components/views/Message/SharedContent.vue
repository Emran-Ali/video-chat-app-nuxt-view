<script setup lang="ts">
import type {
  Channel,
  MessageResponse,
  StreamChat,
  Event as StreamEvent,
} from 'stream-chat'
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  channel: Channel
  client: StreamChat
}

const props = defineProps<Props>()

const emit = defineEmits(['toggle-sidebar'])

const hasContent = ref(false)
const sharedImage = ref<Array<{ id: string; type: string; url: string }>>([])
const sharedFile = ref<
  Array<{ id: string; type: string; url: string; name: string }>
>([])
const sharedLink = ref<Array<{ url: string; type: string }>>([])
const loading = ref(false)
const showVideoPreview = ref(false)
const previewUrl = ref('')

const getFileNameFromUrl = (url: string): string => {
  try {
    const urlWithoutQuery = url.split('?')[0]
    const segments = urlWithoutQuery.split('/')
    const lastSegment = segments[segments.length - 1]
    const parts = lastSegment.split('.')
    return parts[parts.length - 2] + '.' + parts[parts.length - 1]
  } catch (error) {
    return 'Unknown file'
  }
}

const loadSharedContent = async () => {
  if (!props.channel) return

  loading.value = true
  sharedImage.value = []
  sharedFile.value = []
  sharedLink.value = []

  try {
    const response = await props.client.search(
      { cid: props.channel.cid },
      { attachments: { $exists: true } },
      { limit: 100 }
    )

    response.results?.forEach((entry) => {
      const message = entry.message
      if (message.attachments?.length) {
        hasContent.value = true
      }

      message.attachments?.forEach((attachment) => {
        if (attachment.type === 'file' && attachment.asset_url) {
          sharedFile.value.push({
            id: attachment.asset_url || message.id,
            type: 'file',
            url: attachment.asset_url,
            name: attachment.name ?? getFileNameFromUrl(attachment.asset_url),
          })
        }
        if (
          (attachment.type === 'image' || attachment.type === 'video') &&
          attachment.asset_url
        ) {
          const url = attachment.asset_url.toLowerCase()

          const isYouTube =
            url.includes('youtube.com') || url.includes('youtu.be')
          const isVimeo = url.includes('vimeo.com')

          if (!isYouTube && !isVimeo) {
            sharedImage.value.push({
              id: attachment.asset_url || message.id,
              type: attachment.type,
              url: attachment.asset_url,
            })
          }
        }
        if (attachment.og_scrape_url) {
          sharedLink.value.push({
            url: attachment.og_scrape_url,
            type: 'link',
          })
        }
      })
    })
  } catch {
    console.error('Error loading shared content')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.channel,
  (newChannel, oldChannel) => {
    // Rebind message listener to the new channel
    if (oldChannel) {
      oldChannel.off('message.new', handleNewMessage)
    }
    if (newChannel) {
      newChannel.on('message.new', handleNewMessage)
    }

    // Refresh shared content for the new channel
    hasContent.value = false
    loadSharedContent()
  }
)

const handleNewMessage = async (event: StreamEvent) => {
  const messageEvent = event as StreamEvent & {
    cid: string
    message: MessageResponse
  }

  if (messageEvent.cid !== props.channel.cid) return
  if (messageEvent.message.attachments?.length) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await loadSharedContent()
  }
}

const previewVideo = (url: string) => {
  console.log(url)
  showVideoPreview.value = true
  previewUrl.value = url
}

const handleToggleSidebar = () => {
  emit('toggle-sidebar', false)
}

onMounted(async () => {
  props.channel.on('message.new', handleNewMessage)
  await loadSharedContent()
})

onUnmounted(() => {
  props.channel.off('message.new', handleNewMessage)
})
</script>

<template>
  <div class="border-l border-white/5 bg-[#0d1b2a] flex flex-col h-full">
    <!-- Fixed Header -->
    <div
      class="px-4 py-3 flex justify-between items-center border-b border-white/5 bg-[#132336] flex-shrink-0"
    >
      <h3 class="font-bold text-white/80 text-sm tracking-wide">
        Shared Content
      </h3>
      <button
        class="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
        title="Close"
        @click="handleToggleSidebar"
      >
        <i class="pi pi-times text-xs" />
      </button>
    </div>

    <div
      v-if="loading"
      class="flex-1 flex items-center justify-center text-white/20"
    >
      <div class="text-center flex flex-col items-center gap-2">
        <div
          class="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"
        />
        <p class="text-sm text-white/30">Loading shared content...</p>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!hasContent"
      class="flex-1 flex flex-col items-center justify-center text-white/20 gap-2 p-3"
    >
      <i class="pi pi-image text-3xl" />
      <span class="text-sm">No shared content yet</span>
    </div>

    <div v-else class="flex-1 overflow-y-auto p-3 no-scrollbar">
      <div class="space-y-6">
        <!-- Files Section -->
        <div v-if="sharedFile.length > 0" class="space-y-2">
          <h3 class="text-xs font-bold text-teal-400 uppercase tracking-widest">
            Files
          </h3>
          <div class="space-y-2">
            <div
              v-for="file in sharedFile"
              :key="file.id"
              class="flex items-center gap-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/5"
            >
              <svg
                class="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div
                class="flex-1 text-sm text-white/70 hover:text-white/90 truncate flex items-center gap-2"
              >
                {{ file.name }}
              </div>

              <a
                :href="file.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-white/70 hover:text-white/90"
              >
                <svg
                  class="w-5 h-5 text-gray-400 hover:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <!-- Links Section -->
        <div v-if="sharedLink.length > 0" class="space-y-2">
          <h3 class="text-xs font-bold text-teal-400 uppercase tracking-widest">
            Links
          </h3>
          <div class="space-y-2">
            <div
              v-for="link in sharedLink"
              :key="link.url"
              class="bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors truncate border border-white/5"
            >
              <a
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-teal-400 hover:text-teal-200 text-sm"
              >
                {{ link.url }}
              </a>
            </div>
          </div>
        </div>

        <!-- Images Section -->
        <div v-if="sharedImage.length > 0" class="space-y-2">
          <h3 class="text-xs font-bold text-teal-400 uppercase tracking-widest">
            Media
          </h3>
          <div class="grid grid-cols-3 gap-2">
            <div
              v-for="media in sharedImage"
              :key="media.id"
              class="relative group aspect-square border border-gray-300 rounded-lg cursor-pointer overflow-hidden"
            >
              <Image
                v-if="media.type === 'image'"
                :src="media.url"
                :alt="'Shared image'"
                :pt="{
                  image: { class: 'w-full h-full object-cover' },
                }"
                class="w-full h-full"
                preview
              />

              <div
                v-else-if="media.type === 'video'"
                class="w-full h-full"
                @click="previewVideo(media.url)"
              >
                <video
                  :src="media.url"
                  class="w-full h-full object-cover"
                  playsinline
                  preload="metadata"
                />
                <div
                  class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all"
                />
                <div
                  v-if="media.type === 'video'"
                  class="absolute inset-0 flex items-center justify-center"
                >
                  <svg
                    class="h-5 w-5 text-white bg-lime-200 rounded-full opacity-90"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="showVideoPreview"
      modal
      :draggable="false"
      header="Preview Message Video"
      :style="{ width: '90vw', maxWidth: '1000px' }"
      :breakpoints="{ '575px': '95vw' }"
    >
      <div class="flex justify-center items-center rounded-lg overflow-hidden">
        <video
          :src="previewUrl"
          controls
          playsinline
          preload="metadata"
          class="w-full max-h-[80vh] object-contain rounded-lg"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </Dialog>
  </div>
</template>
