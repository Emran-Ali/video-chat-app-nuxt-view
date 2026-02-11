### Documentation: Defining and Using Nuxt.js Plugins with TypeScript

This guide explains how to define and use plugins in a Nuxt.js application with TypeScript. Plugins are a powerful way to extend Nuxt.js functionality, such as adding global Vue components, libraries, or custom logic.

---

## **1. What is a Nuxt.js Plugin?**

A Nuxt.js plugin is a JavaScript or TypeScript file that runs before the Vue application is mounted. Plugins are typically used to:

- Add global Vue components or directives.
- Inject third-party libraries (e.g., PrimeVue, Axios).
- Provide reusable utilities or services.
- Modify the Vue instance or Nuxt context.

---

## **2. Defining a Plugin**

Plugins are placed in the `plugins` directory of your Nuxt.js project. Each plugin file should export a default function that receives the Nuxt context (`nuxtApp`) as an argument.

### **Example: Creating a Plugin**

Let’s create a plugin that injects a custom utility function and configures a third-party library (e.g., PrimeVue).

#### **File: `plugins/myPlugin.ts`**

```typescript
import { defineNuxtPlugin } from '#app'
import PrimeVue from 'primevue/config'

export default defineNuxtPlugin((nuxtApp) => {
  // Inject a custom utility function
  nuxtApp.provide('hello', (name: string) => {
    return `Hello, ${name}!`
  })

  // Use a third-party library (e.g., PrimeVue)
  nuxtApp.vueApp.use(PrimeVue, {
    theme: {
      preset: 'aura',
    },
  })

  // You can also add global components or directives here
  // nuxtApp.vueApp.component('MyComponent', MyComponent)
})
```

---

## **3. Using a Plugin**

Once a plugin is defined, it is automatically registered and available in your Nuxt.js application. You can access injected utilities or libraries in components, pages, or other plugins.

### **Example: Using the Plugin in a Component**

#### **File: `pages/index.vue`**

```vue
<template>
  <div>
    <h1>{{ message }}</h1>
    <Button label="Click Me" />
  </div>
</template>

<script setup lang="ts">
// Access the injected utility function
const { $hello } = useNuxtApp()
const message = $hello('Nuxt.js')

// PrimeVue components are now available globally
</script>
```

---

## **4. Plugin Registration**

Nuxt.js automatically scans the `plugins` directory and registers all plugins. However, you can control the order of plugin execution by prefixing filenames with numbers or using the `plugins` array in `nuxt.config.ts`.

### **Example: Manual Plugin Registration**

#### **File: `nuxt.config.ts`**

```typescript
export default defineNuxtConfig({
  plugins: [
    '~/plugins/myPlugin.ts', // Register the plugin
  ],
})
```

---

## **5. TypeScript Support**

To ensure TypeScript recognizes injected properties (e.g., `$hello`), you can extend the Nuxt and Vue types.

### **Step 1: Extend Nuxt Types**

Create a `types` directory and add a declaration file.

#### **File: `types/nuxt.d.ts`**

```typescript
declare module '#app' {
  interface NuxtApp {
    $hello: (name: string) => string
  }
}

// Extend Vue types if needed
declare module 'vue' {
  interface ComponentCustomProperties {
    $hello: (name: string) => string
  }
}

export {}
```

### **Step 2: Include Types in `tsconfig.json`**

Ensure your `tsconfig.json` includes the `types` directory.

#### **File: `tsconfig.json`**

```json
{
  "compilerOptions": {
    "types": ["./types/nuxt.d.ts"]
  }
}
```

---

## **6. Auto-Imported Composables**

Nuxt.js auto-imports composables like `useNuxtApp`, so you don’t need to manually import them in your components or pages.

### **Example: Using `useNuxtApp`**

```typescript
const { $hello } = useNuxtApp()
console.log($hello('World')) // Output: "Hello, World!"
```

---

## **7. Best Practices**

1. **Keep Plugins Lightweight**:

   - Avoid heavy computations or side effects in plugins.
   - Use plugins only for necessary global configurations.

2. **Use TypeScript for Type Safety**:

   - Extend Nuxt and Vue types to ensure TypeScript recognizes injected properties.

3. **Order Matters**:

   - Prefix plugin filenames with numbers (e.g., `01.myPlugin.ts`) to control execution order.

4. **Test Plugins**:
   - Ensure plugins work correctly in both development and production environments.

---

## **8. Example: Full Plugin with PrimeVue and Custom Utility**

Here’s a complete example of a plugin that configures PrimeVue and injects a custom utility.

#### **File: `plugins/primevue.ts`**

```typescript
import { defineNuxtPlugin } from '#app'
import PrimeVue from 'primevue/config'
import Button from 'primevue/button'

export default defineNuxtPlugin((nuxtApp) => {
  // Configure PrimeVue
  nuxtApp.vueApp.use(PrimeVue, {
    theme: {
      preset: 'aura',
    },
  })

  // Register a global component
  nuxtApp.vueApp.component('Button', Button)

  // Inject a custom utility
  nuxtApp.provide('formatDate', (date: Date) => {
    return date.toLocaleDateString()
  })
})
```

#### **File: `types/nuxt.d.ts`**

```typescript
declare module '#app' {
  interface NuxtApp {
    $formatDate: (date: Date) => string
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $formatDate: (date: Date) => string
  }
}

export {}
```

#### **File: `pages/index.vue`**

```vue
<template>
  <div>
    <p>Today is {{ formattedDate }}</p>
    <Button label="Click Me" />
  </div>
</template>

<script setup lang="ts">
const { $formatDate } = useNuxtApp()
const formattedDate = $formatDate(new Date())
</script>
```

---

## **9. Conclusion**

Plugins are a powerful way to extend Nuxt.js applications. By following this guide, you can define and use plugins with TypeScript, ensuring type safety and maintainability. Whether you’re injecting utilities, configuring libraries, or adding global components, plugins make it easy to enhance your Nuxt.js app.

Let me know if you need further clarification or additional examples! 🚀
