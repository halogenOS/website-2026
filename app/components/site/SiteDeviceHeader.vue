<template>
  <!-- The wrapper gives the header a block box; the inline codename line alone would open the
       page on its own leading. -->
  <div>
    <p
      class="inline-flex items-center gap-[0.45rem] font-display font-semibold
             text-[clamp(0.95rem,3.5vw,1.1rem)] tracking-[0.02em] text-[color:var(--element)]"
    >
      <span
        aria-hidden="true"
        class="h-[1em] w-[3px] rounded-[2px] bg-[var(--element)]"
      />{{ codename }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** The device's codename, printed exactly as the record spells it. */
  codename: string
}>()
</script>
