<!-- The site's card. A caller may set `--card-foot` (a card whose last block scrolls needs
     its content to reach the card's rule) and `--card-room-set` (a card standing under
     another gives back its air). Both are read as name-and-fallback, never overridden by a
     caller's class, because a class cannot be ordered against a container query reliably. -->
<template>
  <section
    :class="BACKING[backing]"
    class="@container relative overflow-hidden rounded-2xl border"
  >
    <slot name="light" />
    <div
      :class="innerClass"
      class="relative [--card-room:var(--card-room-set,clamp(1rem,3.2vw,1.9rem))] p-(--card-room)
             pb-[var(--card-foot,var(--card-room))]
             @min-card-wide:[--card-room:var(--card-room-set,clamp(1.9rem,3cqw,2.5rem))]"
    >
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
// Two whole strings, not a base plus override: two utilities for one property on one
// element are decided by Tailwind's own order, not the order they are written in.
const BACKING = {
  solid: 'border-border bg-surface',
  outline: 'border-[color:color-mix(in_oklab,var(--element)_45%,var(--color-border))]',
} as const

withDefaults(defineProps<{
  innerClass?: string | readonly string[]
  backing?: keyof typeof BACKING
}>(), { backing: 'solid' })
</script>
