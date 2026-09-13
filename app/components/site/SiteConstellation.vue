<template>
  <svg
    viewBox="0 0 300 120"
    aria-hidden="true"
    focusable="false"
    class="pointer-events-none aspect-[5/2]"
  >
    <polyline
      :points="line"
      fill="none"
      :stroke="hair"
      stroke-width="1"
      stroke-linejoin="round"
    />
    <circle
      v-for="[x, y] in points"
      :key="`${x} ${y}`"
      :cx="x"
      :cy="y"
      r="2.4"
      :fill="ink"
    />
  </svg>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** Coordinates use the 300 by 120 viewBox, in line traversal order. */
  points: [number, number][]
  ink: string
  hair: string
}>()

const line = computed(() => props.points.map(([x, y]) => `${x},${y}`).join(' '))
</script>
