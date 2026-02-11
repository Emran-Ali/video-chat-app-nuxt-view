<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Paperclip, X, File, Smile, Send, Mic } from 'lucide-vue-next'

// Interfaces for files and messages
interface FilePreview {
  id: string
  file: File
  type: 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other'
  previewUrl: string
  name: string
  size: string
}

interface EmitMessage {
  text: string
  files: FilePreview[]
  timestamp: Date
}

// Props and emits
const props = defineProps({
  placeholder: {
    type: String,
    default: 'Type a message...',
  },
  maxFiles: {
    type: Number,
    default: 5,
  },
})

const emit = defineEmits(['send-message'])

// Reactive state
const message = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const filePreviewList = ref<FilePreview[]>([])
const isEmojiPickerOpen = ref(false)
const isDragging = ref(false)

// Common file type icons and extensions
const fileTypes = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
  video: ['mp4', 'webm', 'avi', 'mov', 'wmv', 'mkv'],
  audio: ['mp3', 'wav', 'ogg', 'flac', 'aac'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz'],
}

// File type icons (fallback icons for non-previewed files)
const fileTypeIcons = {
  image: '/icons/image-icon.svg',
  video: '/icons/video-icon.svg',
  audio: '/icons/audio-icon.svg',
  document: '/icons/document-icon.svg',
  archive: '/icons/archive-icon.svg',
  other: '/icons/file-icon.svg',
}

// Get file type based on extension
const getFileType = (
  filename: string
): 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other' => {
  const extension = filename.split('.').pop()?.toLowerCase() || ''

  if (fileTypes.image.includes(extension)) return 'image'
  if (fileTypes.video.includes(extension)) return 'video'
  if (fileTypes.audio.includes(extension)) return 'audio'
  if (fileTypes.document.includes(extension)) return 'document'
  if (fileTypes.archive.includes(extension)) return 'archive'

  return 'other'
}

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Handle file selection
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    processFiles(Array.from(input.files))
  }
}

// Process files and create previews
const processFiles = (files: File[]) => {
  // Limit the number of files that can be attached
  const remainingSlots = props.maxFiles - filePreviewList.value.length
  const filesToProcess = files.slice(0, remainingSlots)

  filesToProcess.forEach((file) => {
    const fileType = getFileType(file.name)
    const id = Math.random().toString(36).substring(2, 11)

    // Create preview for images
    if (fileType === 'image') {
      const reader = new FileReader()
      reader.onload = (e) => {
        filePreviewList.value.push({
          id,
          file,
          type: fileType,
          previewUrl: e.target?.result as string,
          name: file.name,
          size: formatFileSize(file.size),
        })
      }
      reader.readAsDataURL(file)
    } else {
      // For non-image files, use type icon
      filePreviewList.value.push({
        id,
        file,
        type: fileType,
        previewUrl: fileTypeIcons[fileType],
        name: file.name,
        size: formatFileSize(file.size),
      })
    }
  })

  // Reset file input to allow selecting the same file again
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Remove a file from preview
const removeFile = (id: string) => {
  filePreviewList.value = filePreviewList.value.filter((item) => item.id !== id)
}

// Handle file paste from clipboard
const handlePaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return

  const files: File[] = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) files.push(file)
    }
  }

  if (files.length > 0) {
    processFiles(files)
  }
}

// Open file dialog
const openFileDialog = () => {
  fileInputRef.value?.click()
}

// Send the message
const sendMessage = () => {
  if (message.value.trim() === '' && filePreviewList.value.length === 0) return

  const newMessage: EmitMessage = {
    text: message.value,
    files: [...filePreviewList.value],
    timestamp: new Date(),
  }

  emit('send-message', newMessage)

  // Reset form
  message.value = ''
  filePreviewList.value = []
}

// Create a function to manage drag and drop events
function createDragAndDropHandler(element: HTMLElement) {
  let dragCounter = 0

  function handleDragEnter(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter++

    if (dragCounter === 1) {
      isDragging.value = true
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter--

    if (dragCounter === 0) {
      isDragging.value = false
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter = 0
    isDragging.value = false

    if (e.dataTransfer?.files.length) {
      processFiles(Array.from(e.dataTransfer.files))
    }
  }

  // Handle document drop to reset state if dropped outside
  function handleDocumentDrop() {
    dragCounter = 0
    isDragging.value = false
  }

  // Set up event listeners
  element.addEventListener('dragenter', handleDragEnter)
  element.addEventListener('dragover', handleDragOver)
  element.addEventListener('dragleave', handleDragLeave)
  element.addEventListener('drop', handleDrop)
  document.addEventListener('drop', handleDocumentDrop)

  // Return cleanup function
  return function cleanup() {
    element.removeEventListener('dragenter', handleDragEnter)
    element.removeEventListener('dragover', handleDragOver)
    element.removeEventListener('dragleave', handleDragLeave)
    element.removeEventListener('drop', handleDrop)
    document.removeEventListener('drop', handleDocumentDrop)
  }
}

// Keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// Computed properties
const canSend = computed(() => {
  return message.value.trim() !== '' || filePreviewList.value.length > 0
})

const hasFiles = computed(() => {
  return filePreviewList.value.length > 0
})

// Emoji picker functionality could be expanded with a library
const addEmoji = (emoji: string) => {
  message.value += emoji
  isEmojiPickerOpen.value = false
}

// Set up event listeners
let cleanupDragAndDrop: (() => void) | null = null

onMounted(() => {
  document.addEventListener('paste', handlePaste)

  // Set up drag and drop handler once the containerRef element is available
  if (containerRef.value) {
    cleanupDragAndDrop = createDragAndDropHandler(containerRef.value)
  }
})

onUnmounted(() => {
  document.removeEventListener('paste', handlePaste)

  // Clean up drag and drop handler
  if (cleanupDragAndDrop) {
    cleanupDragAndDrop()
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="w-full rounded-xl border overflow-hidden relative mt-3"
    :class="{ 'bg-blue-50 border-blue-300': isDragging }"
  >
    <!-- File previews -->
    <div v-if="hasFiles" class="p-2 bg-gray-50 border-b flex flex-wrap gap-2">
      <div
        v-for="file in filePreviewList"
        :key="file.id"
        class="relative rounded-md border overflow-hidden group"
      >
        <!-- Image preview -->
        <div v-if="file.type === 'image'" class="w-20 h-20 relative">
          <img
            :src="getImageVersions(file.previewUrl).thumb"
            :alt="file.name"
            class="w-full h-full object-cover"
          />
          <button
            class="absolute top-1 right-1 bg-black bg-opacity-60 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            @click="removeFile(file.id)"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Other file types -->
        <div
          v-else
          class="w-20 p-2 bg-white flex flex-col items-center justify-center"
        >
          <div class="w-10 h-10 mb-1">
            <File
              v-if="file.type === 'document'"
              class="text-blue-500 w-full h-full"
            />
            <Paperclip
              v-else-if="file.type === 'archive'"
              class="text-orange-500 w-full h-full"
            />
            <File v-else class="text-gray-500 w-full h-full" />
          </div>
          <div class="text-xs truncate w-full text-center">{{ file.name }}</div>
          <button
            class="absolute top-1 right-1 bg-black bg-opacity-60 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            @click="removeFile(file.id)"
          >
            <X :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- Input section -->
    <div class="flex items-center p-1 bg-white">
      <!-- Emoji picker button -->
      <button
        class="p-2 text-gray-500 hover:text-gray-700 rounded-full focus:outline-none"
        @click="isEmojiPickerOpen = !isEmojiPickerOpen"
      >
        <Smile :size="24" />
      </button>

      <!-- File attachment button -->
      <button
        class="p-2 text-gray-500 hover:text-gray-700 rounded-full focus:outline-none"
        @click="openFileDialog"
      >
        <Paperclip :size="24" />
      </button>

      <!-- Hidden file input element -->
      <input
        ref="fileInputRef"
        type="file"
        multiple
        class="hidden"
        @change="handleFileSelect"
      />

      <!-- Message input field -->
      <div class="flex-1 mx-2">
        <textarea
          v-model="message"
          :placeholder="placeholder"
          rows="1"
          class="w-full resize-none border-0 focus:ring-0 outline-none py-2 px-1"
          @keydown="handleKeyDown"
        ></textarea>
      </div>

      <!-- Send/mic button -->
      <button
        v-if="canSend"
        class="p-2 text-blue-500 hover:text-blue-700 rounded-full focus:outline-none"
        @click="sendMessage"
      >
        <Send :size="24" />
      </button>
      <button
        v-else
        class="p-2 text-gray-500 hover:text-gray-700 rounded-full focus:outline-none"
      >
        <Mic :size="24" />
      </button>
    </div>

    <!-- Emoji picker panel (simplified, could be replaced with a library) -->
    <div
      v-if="isEmojiPickerOpen"
      class="p-2 border-t bg-white grid grid-cols-10 gap-1"
    >
      <button
        v-for="emoji in [
          '😀',
          '😂',
          '😊',
          '😍',
          '🥰',
          '😎',
          '👍',
          '❤️',
          '🎉',
          '🔥',
        ]"
        :key="emoji"
        class="text-xl hover:bg-gray-100 rounded p-1"
        @click="addEmoji(emoji)"
      >
        {{ emoji }}
      </button>
    </div>

    <!-- Drop zone overlay -->
    <div
      v-if="isDragging"
      class="absolute top-0 left-0 right-0 bottom-0 w-full h-full bg-blue-500 bg-opacity-10 flex items-center justify-center border-2 border-blue-500 border-dashed rounded-lg z-10"
    >
      <div class="text-center p-4 bg-white rounded-lg shadow">
        <Paperclip :size="32" class="mx-auto mb-2 text-blue-500" />
        <p class="text-lg font-medium">Drop files here</p>
      </div>
    </div>
  </div>
</template>
