/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AxiosError, AxiosResponse } from 'axios'
import axios from 'axios'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  let token = useCookie('_token').value

  const instance = axios.create({
    baseURL: config.public?.BACKEND_URL || '/api/',
  })

  // Request interceptor
  instance.interceptors.request.use((config) => {
    return nuxtApp.runWithContext(() => {
      const currentToken = useCookie('_token').value
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`
      }
      return config
    })
  })

  // Response interceptor
  instance.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => {
      return response
    },
    async (error: AxiosError) => {
      return nuxtApp.runWithContext(async () => {
        try {
          const authStore = useAuthStore()
          if (error.response) {
            console.error('Error Response:', error.response)

            // Handle specific HTTP status codes
            if ([401].includes(error.response.status)) {
              const cookie = useCookie('_token')
              cookie.value = null
              token = null
              await authStore.logout(false)
            } else if ([403].includes(error.response.status)) {
              console.warn('Unauthorized!')
              await navigateTo('/unauthorized')
            }
          } else if (error.request) {
            console.error('No Response: 🦐', error.request)
          } else {
            console.error('Request Error: 🦐', error.message)
          }
        } catch (err) {
          console.error('Response Interceptor Error: 🦐', err)
        }

        return Promise.reject(
          (error as any)?.response?.data?.message ||
            error?.message ||
            error?.status
        )
      })
    }
  )

  function updateToken(newtoken: string) {
    token = newtoken
  }

  function getToken() {
    return token
  }

  return {
    provide: {
      axios: instance,
      updateToken,
      getToken,
    },
  }
})
