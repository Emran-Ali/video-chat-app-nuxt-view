export const useLessonBookStore = defineStore('lessonBook', {
  state: () => ({
    lessonMeeting: null as any,
    isLoading: false,
  }),

  getters: {
    getLessonMeeting: (state) => state.lessonMeeting,
  },

  actions: {
    async fetchLessonMeeting(lessonMeetingId: number) {
      const { $axios } = useNuxtApp()
      const { start, end, handleErrors } = useGlobalStore()

      try {
        start('fetchLessonMeeting')
        this.isLoading = true

        const response = await $axios.get(`/lesson-meetings/${lessonMeetingId}`)
        this.lessonMeeting = response?.data

        return response?.data
      } catch (error) {
        handleErrors(error)
        console.error('Fetch lesson meeting error:', error)
        throw error
      } finally {
        end('fetchLessonMeeting')
        this.isLoading = false
      }
    },

    setLessonMeeting(lessonMeeting: any) {
      this.lessonMeeting = lessonMeeting
    },

    resetLessonMeeting() {
      this.lessonMeeting = null
    },
  },
})
