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

    async initVideoClient() {
      if (this.videoClient) return

      const token = this.getStreamToken
      const user = this.getStreamUser
      const config = useRuntimeConfig()
      const apiKey = config.public.streamApiKey

      if (!token || !user?.id || !apiKey) return

      this.videoClient = new StreamVideoClient({
        apiKey,
        user,
        token,
      })

      // Listen for incoming calls
      this.videoClient.state.incomingCalls$.subscribe((calls) => {
        if (calls.length > 0) {
          this.incomingCall = calls[0]
          // Proactively join the ring state
          this.incomingCall.get()
        } else {
          this.incomingCall = null
        }
      })
    },

    async handleAcceptCall() {
      if (!this.incomingCall) return

      const callId = this.incomingCall.id
      const callType = this.incomingCall.type

      this.incomingCall = null

      navigateTo({
        path: '/call',
        query: {
          callId,
          callType,
        },
      })
    },

    async handleDeclineCall() {
      if (!this.incomingCall) return
      await this.incomingCall.reject()
      this.incomingCall = null
    },
  },
})
