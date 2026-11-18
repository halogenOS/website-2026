<!-- A link to a page on another site where the reader carries out an action, drawn as the
     prominent action of the surface it sits on. The mark is decoration. -->
<template>
  <a
    :href="href"
    :class="VARIANT[variant].root"
    class="no-underline text-inherit motion-safe:transition-colors motion-safe:duration-[180ms]"
  >
    <span :class="VARIANT[variant].label">{{ label }}</span>
    <ArrowUpRight
      aria-hidden="true"
      :class="VARIANT[variant].mark"
    />
  </a>
</template>

<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'

interface ActionSkin {
  readonly root: string
  readonly label: string
  readonly mark: string
}

// Padding of the card variants is the one thing a caller may set, through `--file-room`, with a
// class-side default.
const VARIANT = {
  card: {
    root: `flex items-center justify-between gap-x-[0.9rem] rounded-xl border
           border-[color:var(--element)] p-[var(--file-room,clamp(0.75rem,2.4vw,0.95rem))]
           bg-[color-mix(in_oklab,var(--element)_12%,var(--color-surface))]
           [&:hover]:bg-[color-mix(in_oklab,var(--element)_16%,var(--color-surface))]
           @min-card-wide:max-w-[38rem]`,
    label: 'text-[clamp(1rem,3.6vw,1.15rem)] font-semibold leading-[1.35]',
    mark: 'size-[1.6rem] shrink-0 text-[color:var(--element)]',
  },
  cardSet: {
    root: `flex items-center justify-between gap-x-[0.75rem] rounded-xl border
           border-[color:var(--element)] p-[var(--file-room,clamp(0.75rem,2.4vw,0.95rem))]
           bg-[color-mix(in_oklab,var(--element)_12%,var(--color-surface))]
           [&:hover]:bg-[color-mix(in_oklab,var(--element)_16%,var(--color-surface))]
           @min-card-wide:max-w-[34rem]`,
    label: 'text-[1.05rem] font-semibold leading-[1.35]',
    mark: 'size-[1.5rem] shrink-0 text-[color:var(--element)]',
  },
  row: {
    root: `inline-flex items-center gap-x-[0.5rem] rounded-[9px] border border-[color:var(--element)]
           px-[0.7rem] py-[0.35rem]
           bg-[color-mix(in_oklab,var(--element)_12%,var(--color-surface))]
           [&:hover]:bg-[color-mix(in_oklab,var(--element)_16%,var(--color-surface))]`,
    label: 'text-[0.85rem] font-semibold',
    mark: 'size-4 shrink-0 text-[color:var(--element)]',
  },
} satisfies Record<string, ActionSkin>

defineProps<{
  href: string
  /** The action, in the words the reader sees. */
  label: string
  variant: keyof typeof VARIANT
}>()
</script>
