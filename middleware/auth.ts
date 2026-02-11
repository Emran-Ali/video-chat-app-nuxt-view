export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const normalizedPath = to.path.toLowerCase()

  // Define auth-less routes (public routes)
  const publicRoutes = ['/login', '/sign-up', '/auth/callback', '/404']
  const isPublicRoute = publicRoutes.some((route) =>
    normalizedPath.startsWith(route)
  )

  // Define protected routes that require authentication
  const protectedRoutes = ['/message', '/call', '/']
  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      normalizedPath === route || normalizedPath.startsWith(route + '/')
  )

  try {
    // Check authentication status if not already fetched
    if (!authStore.isUserDataFetched) {
      await authStore.checkAuth()
    }

    // Redirect authenticated users away from public auth pages
    if (isPublicRoute && authStore.isAuthenticated) {
      if (normalizedPath === '/login' || normalizedPath === '/sign-up') {
        return navigateTo('/')
      }
      // Allow callback and 404 even for authenticated users
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
    // On error, redirect to login for protected routes
    if (isProtectedRoute) {
      return navigateTo('/login')
    }
  }
})
