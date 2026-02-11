<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="options.header"
    :style="{ width: '30rem', maxWidth: '95vw' }"
    :closable="!loading"
    :block-scroll="true"
    :dismissable-mask="!loading"
    @hide="handleReject"
  >
    <p class="text-gray-700 mb-6">{{ options.message }}</p>
    <div class="flex justify-end gap-2 mt-6">
      <Button
        :disabled="loading"
        size="small"
        variant="outlined"
        @click="handleReject"
      >
        Cancel
      </Button>
      <Button
        :disabled="loading"
        severity="danger"
        size="small"
        @click="handleAccept"
      >
        <Icon name="mdi:loading" class="animate-spin" v-if="loading" />
        <span>Confirm</span>
      </Button>
    </div>
  </Dialog>
</template>

<script setup>
const visible = ref(false)
const loading = ref(false)

const options = ref({
  header: '',
  message: '',
  onAccept: async () => {},
  onReject: () => {},
  acceptToast: null,
  rejectToast: null,
})

function showConfirmation(payload) {
  options.value = payload
  visible.value = true
}

async function handleAccept() {
  loading.value = true
  try {
    await options.value.onAccept?.()
    if (options.value.acceptToast) {
      console.log('[Toast]', options.value.acceptToast)
    }
    visible.value = false
  } catch (e) {
    console.error('Error in confirm:', e)
  } finally {
    loading.value = false
  }
}

function handleReject() {
  visible.value = false
  options.value.onReject?.()
  if (options.value.rejectToast) {
    console.log('[Toast]', options.value.rejectToast)
  }
}

// expose to parent
defineExpose({ showConfirmation })
</script>
