import { themeColors } from '~/themes/colors'

export const useTheme = () => {
  const colorMode = useColorMode()

  const applyTheme = (themeName: string) => {
    const theme = themeColors[themeName]?.primary

    const colors = themeColors[themeName]

    if (!theme) return

    Object.entries(colors).forEach(([key, value]) => {
      Object.entries(value).forEach((arr) => {
        document.documentElement.style.setProperty(
          `--color-${key}-${arr[0]}`,
          arr[1]
        )
      })
    })

    const { $changeTheme } = useNuxtApp()
    $changeTheme(themeName)
  }

  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('app-theme') || 'base'
    const savedMode = localStorage.getItem('color-mode') || 'light'

    colorMode.preference = savedMode

    nextTick(() => applyTheme(savedTheme))
  }

  const toggleTheme = () => {
    const newMode = colorMode.value === 'dark' ? 'light' : 'dark'
    colorMode.preference = newMode
    localStorage.setItem('color-mode', newMode)
  }

  const setTheme = (themeName: string) => {
    localStorage.setItem('app-theme', themeName)
    applyTheme(themeName)
  }

  onMounted(initializeTheme)

  return {
    toggleTheme,
    setTheme,
    currentTheme: computed(() => colorMode.value),
    availableThemes: Object.keys(themeColors),
  }
}
