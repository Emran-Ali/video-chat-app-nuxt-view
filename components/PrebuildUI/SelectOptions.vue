<script lang="ts" setup>
const selectedCity = ref()
const cities = ref([
  { name: 'New York', code: 'NY' },
  { name: 'Rome', code: 'RM' },
  { name: 'London', code: 'LDN' },
  { name: 'Istanbul', code: 'IST' },
  { name: 'Paris', code: 'PRS' },
])
</script>

<template>
  <div class="flex max-sm:flex-col items-center gap-3 justify-between">
    <Select
      v-model="selectedCity"
      :options="cities"
      option-label="name"
      placeholder="Select Language"
      class="w-fit"
      :pt="{
        label: {
          class: '!text-sm',
        },
        option: {
          class: '!text-sm',
        },
        dropdownIcon: {
          class: '!w-[13px] !h-[13px]',
        },
      }"
    />
    <Select
      v-model="selectedCity"
      :options="cities"
      option-label="name"
      placeholder="Sort By: Recommended"
      class="w-fit"
      :pt="{
        label: {
          class: '!text-sm',
        },
        option: {
          class: '!text-sm',
        },
        dropdownIcon: {
          class: '!w-[13px] !h-[13px]',
        },
      }"
    />
  </div>
</template>
