<script setup lang="ts">
interface FaqItem {
  faq: {
    question: string
  }
  answer: string
}

defineProps<{
  faqAnswer: FaqItem[]
}>()
</script>

<template>
  <div class="mt-5">
    <Accordion value="0" class="space-y-3">
      <AccordionPanel
        v-for="(item, index) in faqAnswer"
        :key="index"
        :pt="{
          root: '!border !rounded-sm !overflow-hidden !text-sm',
        }"
        :value="index.toString()"
      >
        <AccordionHeader
          :pt="{
            root: '!py-3 !text-sm !text-[#222222] !bg-surface-ground !font-[500]',
          }"
        >
          {{ item.faq.question }}
        </AccordionHeader>
        <AccordionContent
          :pt="{
            content: '!text-sm !text-[#585D69] !bg-surface-ground',
          }"
        >
          <p class="m-0">
            {{ item.answer }}
          </p>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </div>
</template>
