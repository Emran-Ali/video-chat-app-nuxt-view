import { useToast } from 'primevue/usetoast'

export default defineNuxtPlugin(() => {
  const toast = useToast()

  // Helper function to adjust toast life based on screen size
  const getResponsiveLife = (defaultLife: number): number => {
    // Shorter duration on mobile for better UX
    if (import.meta.client && window.innerWidth < 576) {
      return Math.min(defaultLife, 8000)
    }
    return defaultLife
  }

  return {
    provide: {
      toast: {
        success: (message: string, summary = 'Success', life = 10000) => {
          toast.add({
            severity: 'success',
            summary,
            detail: message,
            life: getResponsiveLife(life),
          })
        },
        error: (message: string, summary = 'Error', life = 10000) => {
          toast.add({
            severity: 'error',
            summary,
            detail: message,
            life: getResponsiveLife(life),
          })
        },
        warning: (message: string, summary = 'Warning...', life = 10000) => {
          toast.add({
            severity: 'warn',
            summary,
            detail: message,
            life: getResponsiveLife(life),
          })
        },
      },
    },
  }
})
