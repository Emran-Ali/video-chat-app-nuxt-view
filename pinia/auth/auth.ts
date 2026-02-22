/* eslint-disable @typescript-eslint/no-explicit-any */
interface Token {
  accessToken: string
  streamToken: string
  expiresAt: Date
}

interface User {
  id: string
  name: string
  email: string
  photoUrl: string
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN'
  streamUser?: string
  mailVerifyAt?: string | null
}

type AuthType = {
  isUserDataFetched: null | boolean
  isAuthenticated: boolean
  user: null | User
  token: null | string
  streamToken: null | string
}

const initialValue = {
  isUserDataFetched: null,
  isAuthenticated: false,
  user: null,
  token: null,
  streamToken: null,
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthType => initialValue,
  getters: {
    getUser: (state) => state.user,
    isTeacher: (state) => state.user?.role === 'TEACHER',
    streamUser: (state) => state.user?.streamUser,
  },

  actions: {
    async signUp(payload: {
      email: string
      password: string
      fullName: string
      remember?: number
    }) {
      const { start, end, handleErrors, handleSuccess } = useGlobalStore()
      const router = useRouter()
      const { $axios } = useNuxtApp()
      try {
        start('signup')
        const response = await $axios.post('/auth/students/signup', payload)
        this.setTokens(response.data?.data as Token)
        handleSuccess({
          message: 'Account created successfully',
        })

        await this.fetchUser()

        return true
      } catch (error) {
        handleErrors(error)
        console.error('Registration error:', error)
        throw error
      } finally {
        end('signup')
      }
    },

    async googleSignUp(token: string, streamToken: string, isNew = 'false') {
      const { end, handleErrors, handleSuccess } = useGlobalStore()
      const router = useRouter()
      try {
        this.setTokens({ accessToken: token, streamToken } as Token)

        this.isAuthenticated = true

        await this.fetchUser()

        handleSuccess({
          message: 'Logged in successfully',
        })

        if (this.user?.role === 'STUDENT') {
          const query = router.currentRoute.value.query

          if (query.redirect) {
            await router.push(query.redirect as string)
          } else {
            await router.push(
              isNew == 'true'
                ? `/student/account?isNew=${isNew}`
                : '/student/account'
            )
          }
        } else {
          await router.push('/teacher/account')
        }
      } catch (error) {
        handleErrors(error)
        console.error('Login error:', error)
        throw error
      } finally {
        end('login')
      }
    },

    async login({
      email,
      password,
      remember,
    }: {
      email: string
      password: string
      remember?: number
    }) {
      const { start, end, handleErrors, handleSuccess } = useGlobalStore()
      const router = useRouter()
      const { $axios } = useNuxtApp()
      try {
        start('login')
        const response = await $axios.post('/auth/login', {
          email,
          password,
        })
        this.setTokens(response.data?.data as Token, remember)

        const userinfo = await this.fetchUser()

        if (!userinfo?.mailVerifyAt) {
          await router.push({
            path: '/verify-footprint',
            query: { email: userinfo?.email },
          })
          return
        }

        handleSuccess({
          message: 'Logged in successfully',
        })

        const query = router.currentRoute.value.query

        if (query.redirect) {
          await router.push(query.redirect as string)
        } else {
          await router.push('/')
        }
        return true
      } catch (error) {
        handleErrors(error)
        console.error('Login error:', error)
        throw error
      } finally {
        end('login')
      }
    },

    async checkAuth() {
      if (import.meta.server) {
        return
      }
      const _token = useCookie('_token').value
      const _stream_token = useCookie('_stream_token').value

      if (_token && !this.isUserDataFetched) {
        this.setTokens({
          accessToken: _token,
          streamToken: _stream_token ?? '',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        await this.fetchUser()
      }

      return this.isAuthenticated
    },

    setTokens(tokens: Token | null, remember?: number) {
      const { $updateToken } = useNuxtApp()
      const { setStreamToken } = useStreamStore()

      if (tokens) {
        const { accessToken, streamToken } = tokens
        this.token = accessToken

        let expireTime: number = 30

        if (remember) {
          expireTime = remember
        }

        const cookieOptions = {
          expires: new Date(Date.now() + expireTime * 24 * 60 * 60 * 1000),
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        }

        useCookie('_token', cookieOptions).value = accessToken

        setStreamToken(streamToken, cookieOptions)

        $updateToken(accessToken)
      } else {
        this.token = null
        useCookie('_token').value = null
        $updateToken('')
      }
    },

    async fetchUser() {
      const { $axios, $getToken } = useNuxtApp()
      const { start, end, handleErrors } = useGlobalStore()

      try {
        start('fetchUser')
        const token = $getToken()
        if (!token) {
          return false
        }

        const response = await $axios.get('/auth/current-user')
        this.user = response?.data
        this.isUserDataFetched = true

        return response?.data
      } catch (error) {
        handleErrors(error)
        throw error
      } finally {
        end('fetchUser')
      }
    },

    setUser(user: any) {
      this.user = user
    },

    async logout(showSuccessMessage = true) {
      const { handleSuccess } = useGlobalStore()
      const { resetStreamToken } = useStreamStore()

      try {
        this.setTokens(null)
        this.setUser(null)
        resetStreamToken()
        if (showSuccessMessage) {
          handleSuccess({ message: 'Logged out successfully' })
        }

        navigateTo('/login')
      } catch (error) {
        console.error('Logout error:', error)
        throw error
      }
    },
  },
})
