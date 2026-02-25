export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const normalizedPath = to.path.toLowerCase()

  const publicRoutes = ['/login', '/sign-up', '/auth/callback', '/404']
  const isPublicRoute = publicRoutes.some((route) =>
    normalizedPath.startsWith(route)
  )
  const protectedRoutes = ['/message', '/call', '/']
  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      normalizedPath === route || normalizedPath.startsWith(route + '/')
  )

  try {
    // Check authentication status if not already fetched
    if (!authStore.isUserDataFetched) {
      console.log('Checking authentication status...')
      await authStore.checkAuth()
    }

    // Redirect authenticated users away from public auth pages
    if (isPublicRoute && authStore.isAuthenticated) {
      if (normalizedPath === '/login' || normalizedPath === '/sign-up') {
        return navigateTo('/')
      }
      return
    }

    // Protect authenticated routes
    if (isProtectedRoute && !authStore.isAuthenticated) {
      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    if (isProtectedRoute) {
      return navigateTo('/login')
    }
  }
})
