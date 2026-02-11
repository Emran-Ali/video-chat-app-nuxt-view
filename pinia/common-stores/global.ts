/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore, getActivePinia } from 'pinia'

type InitialStateType = {
  wait: { [key: string]: boolean }
  showSidebar: boolean
}

export const useGlobalStore = defineStore('global', {
  state: (): InitialStateType => ({
    wait: {},
    showSidebar: false,
  }),

  getters: {
    is: (state) => (payload: string) => state.wait[payload],
  },

  actions: {
    start(payload: string) {
      this.wait = { ...this.wait, [payload]: true }
    },

    end(payload: string) {
      this.wait = { ...this.wait, [payload]: false }
    },

    handleErrors(error: any) {
      console.log(
        '🚀  handleErrors  error:',
        error?.message,
        error?.response,
        error
      )
      const { $toast } = useNuxtApp()

      if (
        error?.response &&
        error?.response.data &&
        error?.response.data.message
      ) {
        $toast.error(error?.response?.data?.message)
      } else {
        console.log(error, 'error from the global')

        if (error === 'canceled') {
          return
        }

        $toast.error(
          error?.response?.data?.message || error || 'Something went wrong'
        )
      }
    },

    handleSuccess(payload: { message: string }) {
      const { $toast } = useNuxtApp()
      $toast.success(payload.message)
    },

    resetAllStores() {
      // Reset all stores
      ;(getActivePinia() as any)?._s?.forEach((store: any) => {
        store.$reset()
      })
    },
  },
})
