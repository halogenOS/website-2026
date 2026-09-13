<template>
  <!-- Desktop height comes from the row's lit cell; only phone cells need their own minimum height. -->
  <span
    aria-hidden="true"
    class="relative flex items-center justify-center rounded-[5px] border border-border
           backdrop-blur-sm bg-cell-ghost-fill text-on-bg-secondary
           max-desk:min-h-[clamp(2.6rem,6.5svh,3.4rem)]
           desk:border-border-subtle desk:bg-transparent"
  >
    <!-- The wide table's type floor prevents atomic numbers shrinking below its legibility minimum. -->
    <span
      class="absolute start-1.5 top-1 text-[0.58rem] tabular-nums stage-wide:text-(length:--type-floor)"
    >{{ atomicNumber }}</span>
    <!-- Matches the lit symbol's tall-stage and wide-stage scaling. -->
    <span
      class="font-display text-[1.05rem] leading-none
             stage-wide:text-[max(var(--type-floor),1.05*var(--room-rem))]
             stage-tall:text-[clamp(1.05rem,3.2svh,4rem)]"
    >{{ symbol }}</span>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  /** Chemical symbols and atomic numbers are language-invariant data. */
  symbol: string
  atomicNumber: number
}>()
</script>
