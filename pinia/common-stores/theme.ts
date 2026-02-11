import { defineStore } from 'pinia'

type DarkModeType = {
  isDarkMode: boolean
}

export const useThemeStore = defineStore('theme', {
  state: (): DarkModeType => ({
    isDarkMode: false,
  }),

  getters: {
    darkMode(): boolean {
      if (typeof window !== 'undefined') {
        return document.documentElement.classList.contains('dark')
      }
      return false // Default for SSR
    },
  },

  actions: {
    toggleDarkMode() {
      if (typeof window !== 'undefined') {
        this.isDarkMode = !this.isDarkMode
        document.documentElement.classList.toggle('dark')
      }
    },
  },
})
