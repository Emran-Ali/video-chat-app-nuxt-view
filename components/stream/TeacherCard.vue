<script setup lang="ts">
import RatingEmptyStar from '~/components/base/icons/RatingEmptyStarIcon.vue'
import RatingFullStar from '~/components/base/icons/RatingFullStarIcon.vue'
import RatingHalfStar from '~/components/base/icons/RatingHalfStarIcon.vue'

const props = defineProps({
  course: {
    type: Object,
    required: true,
  },
})

const displayedDisciplines = computed(() =>
  (props.course?.teacherDisciplines || []).slice(0, 8)
)

const teacherName = computed(
  () => props.course?.firstName + ' ' + props.course?.lastName
)

const displayedEducations = computed(() =>
  (props.course?.education || []).slice(0, 4)
)
</script>

<template>
  <div
    class="bg-[#101010] border border-neutral-800 rounded-2xl px-4 py-4 space-y-4"
  >
    <div class="flex flex-col md:flex-row gap-4 items-start">
      <div class="flex items-center gap-3">
        <div
          class="h-20 w-20 rounded-2xl overflow-hidden bg-neutral-700 flex items-center justify-center"
        >
          <img
            :src="props.course?.avatarUrl"
            alt="Teacher"
            class="w-full h-full object-cover"
          />
        </div>
        <div>
          <div class="flex items-center gap-2 md:hidden">
            <p class="text-base font-semibold text-neutral-100">
              {{ teacherName }}
            </p>
            <span
              class="px-2 py-0.5 text-xs rounded-lg bg-amber-500 text-black font-semibold"
              >Best Seller</span
            >
          </div>
          <div class="text-[11px] flex flex-wrap items-center gap-2 md:hidden">
            <i class="pi pi-users py-1 text-sm"></i>
            <span class="inline-flex">
              {{ course?.studentCount }} Students</span
            >
            <span>•</span>
            <div class="flex items-center gap-2">
              <p class="">{{ course?.rating }}</p>

              <div class="flex items-center">
                <template v-for="i in 5" :key="i">
                  <!-- Full star -->
                  <RatingFullStar
                    v-if="i <= Math.floor(Number(course?.rating))"
                    fill-color="#F54927"
                  />
                  <!-- Half star -->
                  <RatingHalfStar
                    v-else-if="i - 0.5 <= Number(course?.rating)"
                    fill-color="#F54927"
                  />

                  <!-- Empty star -->
                  <RatingEmptyStar v-else />
                </template>
              </div>
              <p class="">{{ course?.ratingCount || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 space-y-1">
        <div class="md:flex items-center gap-2 hidden">
          <p class="text-base font-semibold text-neutral-100">
            {{ teacherName }}
          </p>
          <span
            class="inline-flex items-center rounded-full bg-white text-black text-[10px] px-2 py-0.5"
          >
            Best Seller
          </span>
        </div>
        <div class="text-[11px] md:flex flex-wrap items-center gap-2 hidden">
          <i class="pi pi-users py-1 text-sm"></i>
          <span class="inline-flex"> {{ course?.studentCount }} Students</span>
          <span>•</span>
          <div class="flex items-center gap-2">
            <p class="">{{ course?.rating }}</p>

            <div class="flex items-center">
              <template v-for="i in 5" :key="i">
                <!-- Full star -->
                <RatingFullStar
                  v-if="i <= Math.floor(Number(course?.rating))"
                  fill-color="#F54927"
                />
                <!-- Half star -->
                <RatingHalfStar
                  v-else-if="i - 0.5 <= Number(course?.rating)"
                  fill-color="#F54927"
                />

                <!-- Empty star -->
                <RatingEmptyStar v-else />
              </template>
            </div>
            <p class="">{{ course?.ratingCount || 0 }}</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 py-2 text-[11px]">
          <span
            v-for="(education, index) in displayedEducations"
            :key="index"
            class="px-2 py-1 rounded-md bg-yellow-100/20 border border-yellow-200 text-yellow-200"
          >
            ★ {{ education.degree }}
          </span>
        </div>
        <div class="flex flex-wrap gap-1 text-[11px]">
          <span
            v-for="(disp, index) in displayedDisciplines"
            :key="index"
            class="px-2 py-1 w-fit flex items-center gap-1 rounded-md bg-neutral-900/40 border border-neutral-700 text-neutral-300"
          >
            <svg
              width="7"
              height="11"
              viewBox="0 0 6 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 0.499756H6V2.49194H4.00781V7.50757C4.00781 8.05444 3.80469 8.52319 3.39844 8.91382C3.00781 9.30444 2.53906 9.49976 1.99219 9.49976C1.44531 9.49976 0.976562 9.30444 0.585938 8.91382C0.195312 8.52319 0 8.05444 0 7.50757C0 6.96069 0.195312 6.49194 0.585938 6.10132C0.976562 5.69507 1.44531 5.49194 1.99219 5.49194C2.32031 5.49194 2.65625 5.58569 3 5.77319V0.499756Z"
                fill="white"
              />
            </svg>
            {{ disp?.discipline.name }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
