export const useAdminStreamStore = defineStore('adminStreamStore', {
  getters: {},

  actions: {
    async isHostOnline(callId: string) {
      const { $axios } = useNuxtApp()

      try {
        const response = await $axios.post(`/stream-webhook/isHostOnline`, {
          callId: callId.toString(),
        })
        return response?.data
      } catch (error) {
        console.error('isHostOnline Error', error)
        throw error
      }
    },

    async createCall() {
      const { $axios } = useNuxtApp()

      return wrapApiCall('createCall', async () => {
        const response = await $axios.post(`/admin-test-call`)

        return response?.data
      })
    },
  },
})
