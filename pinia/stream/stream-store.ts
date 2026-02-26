export const useStreamStore = defineStore('streamStore', {
  state: () => ({
    streamToken: null,
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
  },
})
