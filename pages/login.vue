<script setup lang="ts">
import { ErrorMessage, Field, useForm } from 'vee-validate'
import { loginValidation } from '~/utils/validation/user-validation'

definePageMeta({
  middleware: 'auth',
})

// Define a proper type for form values
interface FormValues {
  email: string
  password: string
}

const authStore = useAuthStore()
const { is } = useGlobalStore()
const config = useRuntimeConfig()

const remember = ref(false)

console.log('auth status : ', authStore.isAuthenticated)

// Use VeeValidate's useForm composable
const { handleSubmit } = useForm<FormValues>({
  validationSchema: loginValidation,
  initialValues: {
    email: '',
    password: '',
  },
})

// Form submission handler
const onSubmit = handleSubmit((values) => {
  if (remember.value) {
    authStore.login({ ...values, remember: 30 })
  } else {
    authStore.login(values)
  }
})

const handleGoogleLogin = () => {
  window.location.href = `${config.public.BACKEND_URL}auth/google`
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden"
    data-cy="login-page"
  >
    <!-- Animated background elements -->
    <div
      class="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"
    ></div>
    <div
      class="absolute bottom-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"
    ></div>

    <BaseContainer class="z-10 w-full max-w-[500px]" data-cy="login-container">
      <div
        class="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/60 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:border-slate-700/80"
      >
        <div class="text-center mb-12">
          <h1
            class="text-4xl font-black text-white mb-3 tracking-tight"
            data-cy="login-title"
          >
            Login
          </h1>
          <p class="text-slate-400 text-sm">
            Don't have an account?
            <NuxtLink
              to="/sign-up"
              class="text-primary-400 hover:text-primary-300 font-semibold transition-all underline-offset-4 hover:underline"
              data-cy="signup-link"
            >
              Sign up
            </NuxtLink>
          </p>
        </div>

        <form
          class="flex flex-col gap-6 w-full"
          data-cy="login-form"
          @submit="onSubmit"
        >
          <!-- Email Field -->
          <div class="flex flex-col gap-2.5">
            <label
              for="email"
              class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
              >Email Address</label
            >
            <Field v-slot="{ field, errorMessage, meta }" name="email">
              <InputText
                id="email"
                type="text"
                placeholder="email@example.com"
                fluid
                v-bind="field"
                :class="{ '!border-red-500/50': meta.touched && errorMessage }"
                data-cy="login-email-input"
              />
            </Field>
            <ErrorMessage v-slot="{ message }" name="email">
              <Message
                severity="error"
                variant="simple"
                class="!text-[11px] !font-medium ml-1"
                >{{ message }}</Message
              >
            </ErrorMessage>
          </div>

          <!-- Password Field -->
          <div class="flex flex-col gap-2.5">
            <div class="flex justify-between items-center ml-1">
              <label
                for="password"
                class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                >Password</label
              >
              <NuxtLink
                to="/forgot-password"
                class="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium"
              >
                Forgot password?
              </NuxtLink>
            </div>
            <Field v-slot="{ field, errorMessage, meta }" name="password">
              <Password
                id="password"
                placeholder="**********"
                :input-props="{ maxlength: 32 }"
                toggle-mask
                fluid
                v-bind="field"
                class="w-full"
                :invalid="Boolean(meta.touched) && Boolean(errorMessage)"
                data-cy="login-password-input"
                :feedback="false"
              />
            </Field>
            <ErrorMessage v-slot="{ message }" name="password">
              <Message
                severity="error"
                variant="simple"
                class="!text-[11px] !font-medium ml-1"
                >{{ message }}</Message
              >
            </ErrorMessage>
          </div>

          <div class="flex items-center gap-3 ml-1">
            <Checkbox
              v-model="remember"
              input-id="remember"
              name="remember"
              binary
              class="!w-5 !h-5"
            />
            <label
              for="remember"
              class="text-sm text-slate-400 cursor-pointer select-none font-medium"
            >
              Remember me
            </label>
          </div>

          <Button
            type="submit"
            :disabled="is('login')"
            class="!bg-primary-600 !border-none !text-white hover:!bg-primary-500 active:scale-[0.98] transition-all rounded-2xl py-4.5 font-bold shadow-xl shadow-primary-900/20 mt-4 h-14"
            data-cy="login-submit-button"
          >
            <div class="flex items-center justify-center gap-3">
              <span v-if="!is('login')">Login</span>
              <span v-else>Processing...</span>
              <BaseLoadingIcon v-if="is('login')" class="w-5 h-5" />
            </div>
          </Button>

          <div class="flex items-center gap-4 my-4">
            <div class="h-[1px] flex-1 bg-slate-800/80"></div>
            <span
              class="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]"
              >OR</span
            >
            <div class="h-[1px] flex-1 bg-slate-800/80"></div>
          </div>

          <Button
            variant="outlined"
            class="!border-slate-700/50 !bg-slate-800/40 hover:!bg-slate-800/60 !text-white transition-all rounded-2xl py-4 h-12"
            @click="handleGoogleLogin"
          >
            <div class="flex items-center justify-center gap-3 w-full">
              <Icon name="logos:google-icon" size="20" />
              <span class="text-sm font-bold">Continue with Google</span>
            </div>
          </Button>
        </form>
      </div>
    </BaseContainer>
  </div>
</template>
