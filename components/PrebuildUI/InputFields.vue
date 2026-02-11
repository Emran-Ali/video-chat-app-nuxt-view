<script setup lang="ts">
import { ref } from 'vue'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { useToast } from 'primevue/usetoast'
import { z } from 'zod'
import { Form } from '@primevue/forms'

const toast = useToast()
const initialValues = ref({
  username: '',
  email: '',
})

const resolver = ref(
  zodResolver(
    z.object({
      username: z.string().min(1, { message: 'Username is required.' }),
      password: z.string().min(1, { message: 'Password is required.' }),
      email: z
        .string()
        .min(1, { message: 'Email is required.' })
        .email({ message: 'Invalid email address.' }),
    })
  )
)

const onFormSubmit = ({ valid }:any) => {
  if (valid) {
    toast.add({
      severity: 'success',
      summary: 'Form is submitted.',
      life: 3000,
    })
  }
}
</script>

<template>
  <div class="max-w-[432px]">
    <Form
      v-slot="$form"
      class="flex flex-col gap-4 w-full"
      :resolver="resolver"
      :initialValues="initialValues"
      @submit="onFormSubmit"
    >
      <div class="flex flex-col gap-1">
        <InputText name="username" type="text" placeholder="Username" fluid />
        <Message
          v-if="$form.username?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form.username.error?.message }}
        </Message>
      </div>
      <div class="flex flex-col gap-1">
        <Password
          name="password"
          type="text"
          to
          placeholder="Username"
          toggle-mask
          fluid
        />
        <Message
          v-if="$form.password?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form.password.error?.message }}
        </Message>
      </div>

      <div class="flex flex-col gap-1">
        <InputText name="email" type="text" placeholder="Email" fluid />
        <Message
          v-if="$form.email?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form.email.error?.message }}
        </Message>
      </div>
      <Button type="submit" severity="secondary" label="Submit" />
    </Form>
  </div>
</template>

<style>
.p-message-text {
  @apply !text-sm !font-normal;
}
</style>
