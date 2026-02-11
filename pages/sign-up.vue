<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ErrorMessage, Field, useForm } from 'vee-validate'
import * as yup from 'yup'

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

// Define validation schema using Yup
const validationSchema = yup.object({
  password: yup
    .string()
    .required('Password is required.')
    .min(8, 'Password must be at least 8 characters.')
    .max(32, 'Password must be no more than 32 characters.'),
  email: yup
    .string()
    .required('Email is required.')
    .email('Invalid email address.')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address.'),
  name: yup
    .string()
    .required('Name is required.')
    .min(3, 'Name must be at least 3 characters.')
    .max(32, 'Name must be no more than 32 characters.'),
  photo: yup.string().required('Photo is required.'),
})

const remember = ref(false)

// Use VeeValidate's useForm composable
const { handleSubmit } = useForm<FormValues>({
  validationSchema,
  initialValues: {
    email: '',
    password: '',
    name: '',
    photo: '',
  },
})

// Form submission handler
const onSubmit = handleSubmit((values) => {
  authStore.signUp(values)
})

const handleGoogleLogin = () => {
  window.location.href = `${config.public.BACKEND_URL}auth/google`
}
</script>

<template>
  <div class="" data-cy="sign-up-page">
    <BaseContainer class="py-6 sm:py-14" data-cy="sign-up-container">
      <div
        class="max-w-[560px] bg-surface-section mx-auto p-5 sm:p-16 border rounded-xl shadow"
      >
        <h2 class="title_xl text-center" data-cy="sign-up-title">Sign Up</h2>
        <div class="text-center">
          <span class="paragraph_secondary">Don't have an account? </span>
          <NuxtLink to="/sign-up" data-cy="signup-link">
            <span class="paragraph_secondary text-blue-500"> Sign up </span>
          </NuxtLink>
        </div>

        <div class="mt-4">
          <form
            class="flex flex-col gap-4 w-full"
            data-cy="sign-up-form"
            @submit="onSubmit"
          >
            <!-- Email Field -->
            <div
              class="flex flex-col gap-1"
              data-cy="sign-up-email-field-container"
            >
              <label for="email" class="paragraph_secondary">Email</label>
              <Field v-slot="{ field, errorMessage, meta }" name="email">
                <InputText
                  id="email"
                  type="text"
                  placeholder="email@example.com"
                  fluid
                  v-bind="field"
                  :class="{ 'p-invalid': meta.touched && errorMessage }"
                  data-cy="sign-up-email-input"
                />
              </Field>
              <ErrorMessage v-slot="{ message }" name="email">
                <Message
                  severity="error"
                  size="small"
                  variant="simple"
                  data-cy="sign-up-email-error"
                >
                  {{ message }}
                </Message>
              </ErrorMessage>
            </div>

            <div
              class="flex flex-col gap-1"
              data-cy="sign-up-name-field-container"
            >
              <label for="name" class="paragraph_secondary">Name</label>
              <Field v-slot="{ field, errorMessage, meta }" name="name">
                <InputText
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  fluid
                  v-bind="field"
                  :class="{ 'p-invalid': meta.touched && errorMessage }"
                  data-cy="sign-up-name-input"
                />
              </Field>
              <ErrorMessage v-slot="{ message }" name="name">
                <Message
                  severity="error"
                  size="small"
                  variant="simple"
                  data-cy="sign-up-name-error"
                >
                  {{ message }}
                </Message>
              </ErrorMessage>
            </div>

            <div
              class="flex flex-col gap-1"
              data-cy="sign-up-email-field-container"
            >
              <label for="photo" class="paragraph_secondary">Photo Url</label>
              <Field v-slot="{ field, errorMessage, meta }" name="photo">
                <InputText
                  id="photo"
                  type="text"
                  placeholder="https://example.com/photo.jpg"
                  fluid
                  v-bind="field"
                  :class="{ 'p-invalid': meta.touched && errorMessage }"
                  data-cy="sign-up-photo-input"
                />
              </Field>
              <ErrorMessage v-slot="{ message }" name="photo">
                <Message
                  severity="error"
                  size="small"
                  variant="simple"
                  data-cy="sign-up-photo-error"
                >
                  {{ message }}
                </Message>
              </ErrorMessage>
            </div>

            <!-- Password Field -->
            <div
              class="flex flex-col gap-1"
              data-cy="sign-up-password-field-container"
            >
              <label for="password" class="paragraph_secondary">Password</label>
              <Field v-slot="{ field, errorMessage, meta }" name="password">
                <Password
                  id="password"
                  placeholder="**********"
                  :input-props="{
                    maxlength: 32,
                  }"
                  toggle-mask
                  fluid
                  v-bind="field"
                  :invalid="Boolean(meta.touched) && Boolean(errorMessage)"
                  data-cy="sign-up-password-input"
                  :feedback="false"
                />
              </Field>
              <ErrorMessage v-slot="{ message }" name="password">
                <Message
                  severity="error"
                  size="small"
                  variant="simple"
                  data-cy="sign-up-password-error"
                >
                  {{ message }}
                </Message>
              </ErrorMessage>
            </div>

            <Button
              type="submit"
              :disabled="is('login')"
              data-cy="sign-up-submit-button"
            >
              Sign Up
              <BaseLoadingIcon
                v-if="is('login')"
                data-cy="sign-up-loading-icon"
              />
            </Button>

            <div
              class="flex items-center justify-between gap-2 flex-wrap"
              data-cy="remember-forgot-container"
            >
              <div class="flex items-center gap-2">
                <Checkbox
                  v-model="remember"
                  input-id="remember"
                  name="remember"
                  size="small"
                  data-cy="sign-up-remember-checkbox"
                  binary
                />
                <label
                  for="remember"
                  class="paragraph_secondary cursor-pointer"
                >
                  Remember for 30 days
                </label>
              </div>

              <NuxtLink to="/forgot-password" data-cy="forgot-password-link">
                <p class="paragraph_secondary !text-blue-500">
                  Forgot password?
                </p>
              </NuxtLink>
            </div>

            <div class="flex items-center gap-2" data-cy="divider">
              <div class="h-0.5 w-full border-b" />
              <p class="text-sm text-black">Or</p>
              <div class="h-0.5 w-full border-b" />
            </div>

            <Button
              variant="outlined"
              data-cy="google-login-button"
              @click="handleGoogleLogin"
            >
              <div class="flex items-center gap-2 justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M15.04 8.16797C15.04 7.64797 14.9933 7.14797 14.9067 6.66797H8V9.50464H11.9467C11.7767 10.4213 11.26 11.198 10.4833 11.718V13.558H12.8533C14.24 12.2813 15.04 10.4013 15.04 8.16797Z"
                    fill="#1F73B7"
                  />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M7.99987 15.3345C9.97987 15.3345 11.6399 14.6779 12.8532 13.5579L10.4832 11.7179C9.82653 12.1579 8.98653 12.4179 7.99987 12.4179C6.08987 12.4179 4.4732 11.1279 3.89653 9.39453H1.44653V11.2945C2.6532 13.6912 5.1332 15.3345 7.99987 15.3345Z"
                    fill="#34A853"
                  />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M3.89663 9.3937C3.74996 8.9537 3.66663 8.4837 3.66663 8.00036C3.66663 7.51703 3.74996 7.04703 3.89663 6.60703V4.70703H1.44663C0.949959 5.69703 0.666626 6.81703 0.666626 8.00036C0.666626 9.1837 0.949959 10.3037 1.44663 11.2937L3.89663 9.3937Z"
                    fill="#FBBC05"
                  />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M7.99987 3.58464C9.07653 3.58464 10.0432 3.95464 10.8032 4.6813L12.9065 2.57797C11.6365 1.39464 9.97653 0.667969 7.99987 0.667969C5.1332 0.667969 2.6532 2.3113 1.44653 4.70797L3.89653 6.60797C4.4732 4.87464 6.08987 3.58464 7.99987 3.58464Z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </div>
            </Button>
          </form>

          <div
            class="paragraph_secondary mt-6"
            data-cy="terms-privacy-container"
          >
            By continuing, you agree to Craft Music's
            <NuxtLink
              to="/terms-of-service"
              class="text-blue-500"
              data-cy="terms-link"
            >
              Terms of Service
            </NuxtLink>
            and acknowledge our
            <NuxtLink
              to="/privacy-policy"
              class="text-blue-500"
              data-cy="privacy-link"
              >Privacy Policy
            </NuxtLink>
            .
          </div>
        </div>
      </div>
    </BaseContainer>
  </div>
</template>
