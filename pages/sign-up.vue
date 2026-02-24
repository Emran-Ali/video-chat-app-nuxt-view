<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ErrorMessage, Field, useForm } from 'vee-validate'
import { signUpValidation } from '~/utils/validation/user-validation'

definePageMeta({
  middleware: 'auth',
})

// Define a proper type for form values
interface FormValues {
  email: string
  password: string
  name: string
  image: string
}

const authStore = useAuthStore()
const { is } = useGlobalStore()
const config = useRuntimeConfig()

const remember = ref(false)

// Use VeeValidate's useForm composable
const { handleSubmit } = useForm<FormValues>({
  validationSchema: signUpValidation,
  initialValues: {
    email: '',
    password: '',
    name: '',
    image: '',
  },
})

// Form submission handler
const onSubmit = handleSubmit((values) => {
  authStore.signUp({
    email: values.email,
    password: values.password,
    name: values.name,
    image: values.image,
  })
})

const handleGoogleLogin = () => {
  window.location.href = `${config.public.BACKEND_URL}auth/google`
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden"
    data-cy="sign-up-page"
  >
    <!-- Animated background elements -->
    <div
      class="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2"
    ></div>
    <div
      class="absolute bottom-0 left-0 w-96 h-96 bg-primary-600/10 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2"
    ></div>

    <BaseContainer
      class="z-10 w-full max-w-[550px]"
      data-cy="sign-up-container"
    >
      <div
        class="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/60 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:border-slate-700/80"
      >
        <div class="text-center mb-10">
          <h1
            class="text-4xl font-black text-white mb-3 tracking-tight"
            data-cy="sign-up-title"
          >
            Join Us
          </h1>
          <p class="text-slate-400 text-sm">
            Already have an account?
            <NuxtLink
              to="/login"
              class="text-primary-400 hover:text-primary-300 font-semibold transition-all underline-offset-4 hover:underline"
              data-cy="login-link"
            >
              Sign in
            </NuxtLink>
          </p>
        </div>

        <form
          class="flex flex-col gap-5 w-full"
          data-cy="sign-up-form"
          @submit="onSubmit"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <!-- Name Field -->
            <div class="flex flex-col gap-2">
              <label
                for="name"
                class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
                >Full Name</label
              >
              <Field v-slot="{ field, errorMessage, meta }" name="name">
                <InputText
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  fluid
                  v-bind="field"
                  class="!bg-slate-800/40 !border-slate-700/50 !text-white !placeholder-slate-500 focus:!border-primary-500/50 transition-all rounded-2xl py-3.5 px-5"
                  :class="{
                    '!border-red-500/50': meta.touched && errorMessage,
                  }"
                  data-cy="sign-up-name-input"
                />
              </Field>
              <ErrorMessage v-slot="{ message }" name="name">
                <Message
                  severity="error"
                  variant="simple"
                  class="!text-[10px] !font-medium ml-1"
                  >{{ message }}</Message
                >
              </ErrorMessage>
            </div>

            <!-- Photo Field -->
            <div class="flex flex-col gap-2">
              <label
                for="image"
                class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
                >Photo URL</label
              >
              <Field v-slot="{ field, errorMessage, meta }" name="image">
                <InputText
                  id="image"
                  type="text"
                  placeholder="https://..."
                  fluid
                  v-bind="field"
                  class="!bg-slate-800/40 !border-slate-700/50 !text-white !placeholder-slate-500 focus:!border-primary-500/50 transition-all rounded-2xl py-3.5 px-5"
                  :class="{
                    '!border-red-500/50': meta.touched && errorMessage,
                  }"
                  data-cy="sign-up-photo-input"
                />
              </Field>
              <ErrorMessage v-slot="{ message }" name="image">
                <Message
                  severity="error"
                  variant="simple"
                  class="!text-[10px] !font-medium ml-1"
                  >{{ message }}</Message
                >
              </ErrorMessage>
            </div>
          </div>

          <!-- Email Field -->
          <div class="flex flex-col gap-2">
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
                class="!bg-slate-800/40 !border-slate-700/50 !text-white !placeholder-slate-500 focus:!border-primary-500/50 transition-all rounded-2xl py-3.5 px-5"
                :class="{ '!border-red-500/50': meta.touched && errorMessage }"
                data-cy="sign-up-email-input"
              />
            </Field>
            <ErrorMessage v-slot="{ message }" name="email">
              <Message
                severity="error"
                variant="simple"
                class="!text-[10px] !font-medium ml-1"
                >{{ message }}</Message
              >
            </ErrorMessage>
          </div>

          <!-- Password Field -->
          <div class="flex flex-col gap-2">
            <label
              for="password"
              class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
              >Password</label
            >
            <Field v-slot="{ field, errorMessage, meta }" name="password">
              <Password
                id="password"
                placeholder="**********"
                :input-props="{ maxlength: 32 }"
                toggle-mask
                fluid
                v-bind="field"
                class="w-full"
                input-class="!bg-slate-800/40 !border-slate-700/50 !text-white !placeholder-slate-500 focus:!border-primary-500/50 transition-all rounded-2xl py-3.5 px-5 w-full"
                :invalid="Boolean(meta.touched) && Boolean(errorMessage)"
                data-cy="sign-up-password-input"
                :feedback="false"
              />
            </Field>
            <ErrorMessage v-slot="{ message }" name="password">
              <Message
                severity="error"
                variant="simple"
                class="!text-[10px] !font-medium ml-1"
                >{{ message }}</Message
              >
            </ErrorMessage>
          </div>

          <Button
            type="submit"
            :disabled="is('login')"
            class="!bg-primary-600 !border-none !text-white hover:!bg-primary-500 active:scale-[0.98] transition-all rounded-2xl py-4 font-bold shadow-xl shadow-primary-900/20 mt-4 h-14"
            data-cy="sign-up-submit-button"
          >
            <div class="flex items-center justify-center gap-3">
              <span v-if="!is('login')">Create Account</span>
              <span v-else>Creating...</span>
              <BaseLoadingIcon v-if="is('login')" class="w-5 h-5" />
            </div>
          </Button>

          <div class="flex items-center gap-4 my-2">
            <div class="h-[1px] flex-1 bg-slate-800/80"></div>
            <span
              class="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]"
              >OR</span
            >
            <div class="h-[1px] flex-1 bg-slate-800/80"></div>
          </div>

          <Button
            variant="outlined"
            class="!border-slate-700/50 !bg-slate-800/40 hover:!bg-slate-800/60 !text-white transition-all rounded-2xl py-4 h-12 transition-all"
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
