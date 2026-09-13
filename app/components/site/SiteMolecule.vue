<template>
  <svg
    viewBox="0 0 200 120"
    aria-hidden="true"
    focusable="false"
    class="pointer-events-none aspect-[5/3]"
  >
    <line
      x1="81"
      y1="60"
      x2="119"
      y2="60"
      :stroke="ink"
      stroke-width="2"
    />
    <g
      fill="none"
      :stroke="ink"
      stroke-width="1.5"
    >
      <circle
        cx="55"
        cy="60"
        r="26"
      />
      <circle
        cx="145"
        cy="60"
        r="26"
      />
    </g>
    <g
      class="font-display"
      :fill="ink"
      font-size="22"
      text-anchor="middle"
      dominant-baseline="central"
    >
      <text
        x="55"
        y="60"
      >{{ symbol }}</text>
      <text
        x="145"
        y="60"
      >{{ symbol }}</text>
    </g>
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  /** Chemical symbols are language-invariant data, not translated copy. */
  symbol: string
  ink: string
}>()
</script>
