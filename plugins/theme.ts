import { defineNuxtPlugin } from '#app'
import { usePreset } from '@primeuix/themes'
import { themes } from '@/themes/getPreset'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      changeTheme: (themeName: string) => {
        const selectedTheme = themes[themeName]
        if (selectedTheme) {
          usePreset(selectedTheme)
          localStorage.setItem('app-theme', themeName)
        }
      },
      initializeTheme: () => {
        const selectedTheme = themes['base']
        if (selectedTheme) {
          usePreset(selectedTheme)
          localStorage.setItem('app-theme', 'base')
        }
      },
      getTheme: () => themes.base,
    },
  }
})
