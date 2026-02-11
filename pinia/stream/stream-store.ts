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
      let id = ''

      if (authStore.getUser?.role === 'STUDENT') {
        id = `student-${authStore.getUser?.id}`
      } else if (authStore.getUser?.role === 'TEACHER') {
        id = `teacher-${authStore.getUser?.id}`
      } else if (authStore.getUser?.role === 'ADMIN') {
        id = `admin`
      }

      return {
        id,
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

    async isHostOnline(callId: any) {
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

    async createCall(lessonId: any, teacherId: any, studentId: any) {
      const { $axios } = useNuxtApp()

      return wrapApiCall('createCall', async () => {
        const response = await $axios.post(
          `/stream-webhook/create-lesson-call`,
          {
            lessonMeetingId: lessonId.toString(),
            teacherId: teacherId.toString(),
            studentId: studentId.toString(),
          }
        )

        return response?.data
      })
    },

    async notifyStudent(lessonMeetingId: number) {
      const { $axios } = useNuxtApp()

      return wrapApiCall('notifyStudent', async () => {
        const response = await $axios.post(`/stream-webhook/notify-lesson`, {
          lessonMeetingId,
        })

        return response?.data
      })
    },

    async extendCallDuration(lessonId: string, minutes: number) {
      const { $axios } = useNuxtApp()
      const { handleSuccess } = useGlobalStore()

      return wrapApiCall('extendCallDuration', async () => {
        await $axios.post(`/stream-webhook/extend-call`, {
          callId: lessonId,
          duration: minutes,
        })

        handleSuccess({ message: 'Call extended successfully' })
      })
    },
  },
})
