### **Short Documentation: Using Pinia with TypeScript in Nuxt.js**

Pinia is the official state management library for Vue.js, offering a simple and type-safe way to manage global state. This guide explains how to set up and use Pinia in a Nuxt.js application with TypeScript.

---

## **1. Install Pinia**

First, install Pinia and its Nuxt module:

```bash
npm install @pinia/nuxt pinia
```

---

## **2. Configure Pinia in Nuxt.js**

Add the `@pinia/nuxt` module to your `nuxt.config.ts`:

#### **File: `nuxt.config.ts`**

```typescript
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
})
```

---

## **3. Define a Store**

Stores are defined using the `defineStore` function. Each store manages a specific piece of state.

#### **File: `stores/counter.ts`**

```typescript
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
  }),
  actions: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
  },
  getters: {
    doubleCount: (state) => state.count * 2,
  },
})
```

---

## **4. Use the Store in Components**

You can access the store in your components using the `useCounterStore` composable.

#### **File: `pages/index.vue`**

```vue
<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Double Count: {{ doubleCount }}</p>
    <button @click="increment">Increment</button>
    <button @click="decrement">Decrement</button>
  </div>
</template>

<script setup lang="ts">
const counterStore = useCounterStore()
const { count, doubleCount } = storeToRefs(counterStore)
const { increment, decrement } = counterStore
</script>
```

---

## **5. Type Safety with TypeScript**

Pinia automatically infers types for state, actions, and getters. However, you can explicitly define types for better clarity.

#### **File: `stores/counter.ts`**

```typescript
interface CounterState {
  count: number
}

export const useCounterStore = defineStore('counter', {
  state: (): CounterState => ({
    count: 0,
  }),
  actions: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
  },
  getters: {
    doubleCount: (state) => state.count * 2,
  },
})
```

---

## **6. Using Stores in Composables**

You can also use Pinia stores in composables for reusable logic.

#### **File: `composables/useCounter.ts`**

```typescript
export const useCounter = () => {
  const counterStore = useCounterStore()
  const { count, doubleCount } = storeToRefs(counterStore)
  const { increment, decrement } = counterStore

  return {
    count,
    doubleCount,
    increment,
    decrement,
  }
}
```

#### **File: `pages/index.vue`**

```vue
<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Double Count: {{ doubleCount }}</p>
    <button @click="increment">Increment</button>
    <button @click="decrement">Decrement</button>
  </div>
</template>

<script setup lang="ts">
const { count, doubleCount, increment, decrement } = useCounter()
</script>
```

---

## **7. Best Practices**

1. **Modular Stores**:

   - Split your state into multiple stores for better organization.

2. **Type Safety**:

   - Use TypeScript interfaces to define state and ensure type safety.

3. **Avoid Overusing Stores**:

   - Use stores only for global state. For local state, use component `ref` or `reactive`.

4. **Testing**:
   - Pinia stores are easy to test because they are plain JavaScript/TypeScript functions.

---

## **8. Example: Full Usage**

Here’s a complete example of a Pinia store and its usage in a Nuxt.js app.

#### **File: `stores/counter.ts`**

```typescript
import { defineStore } from 'pinia'

interface CounterState {
  count: number
}

export const useCounterStore = defineStore('counter', {
  state: (): CounterState => ({
    count: 0,
  }),
  actions: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
  },
  getters: {
    doubleCount: (state) => state.count * 2,
  },
})
```

#### **File: `pages/index.vue`**

```vue
<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Double Count: {{ doubleCount }}</p>
    <button @click="increment">Increment</button>
    <button @click="decrement">Decrement</button>
  </div>
</template>

<script setup lang="ts">
const counterStore = useCounterStore()
const { count, doubleCount } = storeToRefs(counterStore)
const { increment, decrement } = counterStore
</script>
```

---

## **9. Conclusion**

Pinia is a lightweight and type-safe state management solution for Vue.js and Nuxt.js. By following this guide, you can easily set up and use Pinia in your Nuxt.js application with TypeScript.

Let me know if you need further assistance! 🚀
