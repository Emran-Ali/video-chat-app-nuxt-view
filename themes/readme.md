### **Documentation: PrimeVue Theme Management with TypeScript**

This documentation explains how to manage and apply themes in a Nuxt.js application using PrimeVue and TypeScript. The provided code includes a `themeColors` object for defining color scales and a `useTheme` composable for applying and managing themes dynamically.

---

## **1. Theme Colors Definition**

The `themeColors` object defines color scales for different themes. Each theme has a `primary` color scale, which maps numeric keys (e.g., `50`, `100`, ..., `950`) to RGB values.

### **File: `themes/colors.ts`**

```typescript
type ColorScale = {
  [key: number]: string // Maps numeric keys (50, 100, ..., 950) to string values
}

type ThemeColor = {
  primary: ColorScale // Each theme has a primary color scale
}

type ThemeColors = {
  [key: string]: ThemeColor // Maps theme names (e.g., 'teal', 'purple') to ThemeColor
}

export const themeColors: ThemeColors = {
  base: {
    primary: {
      '50': '246 246 246',
      '100': '231 231 231',
      '200': '209 209 209',
      '300': '176 176 176',
      '400': '136 136 136',
      '500': '109 109 109',
      '600': '93 93 93',
      '700': '79 79 79',
      '800': '69 69 69',
      '900': '61 61 61',
      '950': '0 0 0',
    },
  },
  purple: {
    primary: {
      50: '243 229 245',
      100: '225 190 231',
      200: '206 147 216',
      300: '186 104 200',
      400: '171 71 188',
      500: '156 39 176',
      600: '142 36 170',
      700: '123 31 162',
      800: '106 27 154',
      900: '74 20 140',
      950: '123 31 162',
    },
  },
  // Add more themes as needed
}
```

---

## **2. Theme Composable**

The `useTheme` composable provides functions to apply, toggle, and manage themes dynamically. It also integrates with `useColorMode` for light/dark mode support.

### **File: `composables/useTheme.ts`**

```typescript
import { themeColors } from '~/themes/colors'

export const useTheme = () => {
  const colorMode = useColorMode()

  /**
   * Applies a theme by updating CSS variables.
   * @param themeName - The name of the theme to apply.
   */
  const applyTheme = (themeName: string) => {
    const theme = themeColors[themeName]?.primary
    if (!theme) return

    // Update CSS variables for the theme
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(
        `--color-primary-${key}`,
        value
      )
    })

    // Change the theme using a global plugin (if available)
    const { $changeTheme } = useNuxtApp()
    $changeTheme(themeName)
  }

  /**
   * Initializes the theme based on saved preferences.
   */
  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('app-theme') || 'base'
    const savedMode = localStorage.getItem('color-mode') || 'light'

    // Set the color mode (light/dark)
    colorMode.preference = savedMode

    // Apply the saved theme
    nextTick(() => applyTheme(savedTheme))
  }

  /**
   * Toggles between light and dark mode.
   */
  const toggleTheme = () => {
    const newMode = colorMode.value === 'dark' ? 'light' : 'dark'
    colorMode.preference = newMode
    localStorage.setItem('color-mode', newMode)
  }

  /**
   * Sets a new theme and saves it to localStorage.
   * @param themeName - The name of the theme to set.
   */
  const setTheme = (themeName: string) => {
    localStorage.setItem('app-theme', themeName)
    applyTheme(themeName)
  }

  // Initialize the theme when the component is mounted
  onMounted(initializeTheme)

  return {
    toggleTheme, // Function to toggle light/dark mode
    setTheme, // Function to set a specific theme
    currentTheme: computed(() => colorMode.value), // Current color mode (light/dark)
    availableThemes: Object.keys(themeColors), // List of available themes
  }
}
```

---

## **3. Using the Theme Composable**

You can use the `useTheme` composable in your components to manage themes dynamically.

### **Example: Theme Selector Component**

#### **File: `components/ThemeSelector.vue`**

```vue
<template>
  <div>
    <label for="theme-select">Select Theme:</label>
    <select id="theme-select" @change="handleThemeChange">
      <option v-for="theme in availableThemes" :key="theme" :value="theme">
        {{ theme }}
      </option>
    </select>

    <button @click="toggleTheme">
      Toggle {{ currentTheme === 'dark' ? 'Light' : 'Dark' }} Mode
    </button>
  </div>
</template>

<script setup lang="ts">
const { toggleTheme, setTheme, currentTheme, availableThemes } = useTheme()

const handleThemeChange = (event: Event) => {
  const selectedTheme = (event.target as HTMLSelectElement).value
  setTheme(selectedTheme)
}
</script>
```

---

## **4. Applying Themes Globally**

To apply themes globally, you can use the `useTheme` composable in a layout or app component.

### **Example: Global Theme Initialization**

#### **File: `layouts/default.vue`**

```vue
<template>
  <div>
    <ThemeSelector />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const { initializeTheme } = useTheme()

onMounted(() => {
  initializeTheme()
})
</script>
```

---

## **5. CSS Variables for Themes**

The `applyTheme` function updates CSS variables for the selected theme. You can use these variables in your styles.

### **Example: Using CSS Variables**

#### **File: `assets/css/main.css`**

```css
:root {
  --color-primary-50: 246 246 246;
  --color-primary-100: 231 231 231;
  /* Add more variables as needed */
}

body {
  background-color: rgb(var(--color-primary-50));
  color: rgb(var(--color-primary-950));
}
```

---

## **6. Best Practices**

1. **Modular Themes**:

   - Define themes in a separate file (`colors.ts`) for easy maintenance.
   - Add new themes by extending the `themeColors` object.

2. **Persistent Preferences**:

   - Save the selected theme and color mode in `localStorage` for persistence across page reloads.

3. **Dynamic Theme Switching**:

   - Use the `useTheme` composable to dynamically switch themes and update CSS variables.

4. **Type Safety**:
   - Use TypeScript to ensure type safety when working with themes and color modes.

---

## **7. Conclusion**

This setup allows you to manage and apply themes dynamically in a Nuxt.js application using PrimeVue and TypeScript. By leveraging CSS variables and a composable, you can create a flexible and maintainable theming system.

Let me know if you need further assistance! 🚀
