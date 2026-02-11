<script setup lang="ts"></script>

<template>
  <div class="flex flex-wrap gap-3">
    <Button size="small"> Book trial lesson </Button>
    <Button
      size="small"
      :pt="{
        root: {
          class: '!text-surface-color',
        },
      }"
      variant="outlined"
    >
      Book trial lesson
    </Button>
    <Button size="small" rounded> Book trial lesson </Button>
    <Button size="small" variant="outlined" rounded> Book trial lesson </Button>
    <Button
      icon="pi pi-heart"
      severity="secondary"
      rounded
      aria-label="Bookmark"
    />
  </div>
</template>
