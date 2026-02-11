/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  AxiosError,
  AxiosInstance,
  AxiosProgressEvent,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import axios from 'axios'

type UploadProgressCallback = (progress: number) => void

// Create a custom Axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: 'https://api.craft-music.dev/',
  timeout: 10000, // Timeout in ms
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor
axiosInstance.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> => {
    try {
      const token = useCookie('_token').value

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // Handling the headers on the content-type
      if (config?.data instanceof FormData) {
        // addin the multipart form data here
        config.headers['Content-Type'] = 'multipart/form-data'
      } else if (typeof config.data === 'object') {
        config.headers['Content-Type'] = 'application/json'
      } else {
        config.headers['Content-Type'] = 'text/plain'
      }

      return config
    } catch (error) {
      console.error('Request Interceptor Error:', error)
      return Promise.reject(error)
    }
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// adminToken

// Response interceptor
axiosInstance.interceptors.response.use(
  async (response: AxiosResponse): Promise<AxiosResponse> => {
    return response
  },
  async (error: AxiosError) => {
    try {
      console.log(error, 'error from the response')

      if (error.response) {
        console.error('Error Response1:', error.response)

        // Handle specific HTTP status codes
        if ([401, 403].includes(error.response.status)) {
          console.warn('Unauthorized! Redirecting to login... 🦐')
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No Response: 🦐', error.request)

        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
          // Request timeout
          console.log('Your server is down')
        } else if (!navigator.onLine) {
          // No internet connection
          console.log("You don't have internet")
        } else {
          // Other network errors (like server not reachable)
          console.log('Your server is down')
        }
      } else {
        console.error('Request Error: 🦐', error.message)
      }
    } catch (err) {
      console.error('Response Interceptor Error: 🦐', err)
    }

    return Promise.reject(
      (error as any)?.response?.data?.message || error?.status
    )
  }
)

// File upload function with progress tracking
export const uploadFile = async (
  url: string,
  file: File,
  onUploadProgress?: UploadProgressCallback
): Promise<any> => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axiosInstance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onUploadProgress) {
          const progress = Math.round(
            (progressEvent.loaded / progressEvent.total!) * 100
          )
          onUploadProgress(progress)
        }
      },
    })

    console.log('File Upload Response:', response.data)
    return response.data
  } catch (error) {
    console.error('File Upload Error: 🦐', error)
    throw error
  }
}

export default axiosInstance
