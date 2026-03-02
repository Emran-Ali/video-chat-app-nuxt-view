import { StreamVideoClient, type Call } from '@stream-io/video-client'

export const useStreamStore = defineStore('streamStore', {
  state: () => ({
    streamToken: null,
    videoClient: null as StreamVideoClient | null,
    incomingCall: null as Call | null,
  }),

  getters: {
    getStreamToken: (state) => {
      const token = state.streamToken || useCookie('_stream_token').value
      return token
    },
    getStreamUser: (state) => {
      const authStore = useAuthStore()
      return {
        id: authStore.streamUserId,
      }
    },
  },

  actions: {
    setStreamToken(token: any, cookieOptions: any) {
      this.streamToken = token

      useCookie('_stream_token', cookieOptions).value = token
    },
    resetStreamToken() {
      this.streamToken = null
      useCookie('_stream_token').value = null
    },

    async createVideoCall(userId: string, otherUsers: string[]) {
      const { $axios } = useNuxtApp()

      return wrapApiCall('createVideoCall', async () => {
        const response = await $axios.post(`/call/video-call`, {
          userId,
          otherUsers,
        })

        return response?.data
      })
    },

    async createAudioCall(userId: string, otherUsers: string[]) {
      const { $axios } = useNuxtApp()

      return wrapApiCall('createAudioCall', async () => {
        const response = await $axios.post(`/call/audio-call`, {
          userId,
          otherUsers,
        })

        return response?.data
      })
    },

    initVideoClient() {
      const config = useRuntimeConfig()
      const apiKey = config.public.streamApiKey
      const token = this.getStreamToken
      const user = this.getStreamUser

      if (!apiKey || !token || !user.id || this.videoClient) return

      this.videoClient = new StreamVideoClient({
        apiKey,
        token,
        user: { id: user.id },
        options: { logLevel: 'warn' },
      })

      console.log('Video client initialized')
    },

    async disconnect() {
      if (this.videoClient) {
        await this.videoClient.disconnectUser()
        this.videoClient = null
        console.log('Video client disconnected')
      }
    },
  },
})
