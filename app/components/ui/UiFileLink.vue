<!-- A download link for one published file: a plain anchor, because the files live on the
     forge's own storage. The mark is decoration; the visually hidden first word announces
     the download to a screen reader. -->
<template>
  <a
    :href="url"
    :class="VARIANT[variant].root"
    class="no-underline text-inherit desk:tabular-nums motion-safe:transition-colors
           motion-safe:duration-[180ms]"
  >
    <!-- Intent: device.download is the visually hidden first word of every file link,
         announcing the action to a screen reader before the file name. -->
    <span class="sr-only">{{ t('device.download') }}</span>
    <span :class="VARIANT[variant].stack">
      <span
        v-if="description"
        :class="VARIANT[variant].what"
      >{{ description }}</span>
      <span :class="VARIANT[variant].line">
        <span :class="VARIANT[variant].name">{{ name }}</span>
        <span :class="VARIANT[variant].size">{{ fileSize(size) }}</span>
      </span>
    </span>
    <Download
      aria-hidden="true"
      :class="VARIANT[variant].mark"
    />
  </a>
</template>

<script setup lang="ts">
import { Download } from 'lucide-vue-next'

const { t } = useI18n()
const { fileSize } = useBuildFormat()

interface FileSkin {
  readonly root: string
  readonly stack: string
  readonly what: string
  readonly line: string
  readonly name: string
  readonly size: string
  readonly mark: string
}

// Padding of `package` and `packageSet` is the one thing a caller may set, through
// `--file-room`, with a class-side default. Every variant is written out whole, never
// composed: two utilities for one CSS property on one element are decided by Tailwind's
// own order, not the order they are written in.
const VARIANT = {
  // A screen reader hears words, size, then name.
  packageSet: {
    root: `flex items-start gap-x-[0.75rem] rounded-xl border border-[color:var(--element)]
           p-[var(--file-room,clamp(0.75rem,2.4vw,0.95rem))]
           bg-[color-mix(in_oklab,var(--element)_12%,var(--color-surface))]
           [&:hover]:bg-[color-mix(in_oklab,var(--element)_16%,var(--color-surface))]`,
    // The grid applies only when a description adds a second child; without the words its
    // first row would hold the size alone.
    stack: `flex min-w-0 flex-1 flex-wrap items-baseline gap-x-[0.7rem] gap-y-[0.05rem]
           grid-cols-[minmax(0,1fr)_auto] [&:has(>*+*)]:grid
           @min-card-wide:flex-none @min-card-wide:max-w-[34rem]`,
    what: 'col-start-1 row-start-1 text-[1.05rem] font-semibold leading-[1.35]',
    line: 'contents',
    name: `col-span-2 row-start-2 min-w-0 text-[0.85rem] leading-[1.45] text-on-surface-secondary
           [overflow-wrap:anywhere]`,
    size: `col-start-2 row-start-1 whitespace-nowrap tabular-nums text-[0.85rem] leading-[1.45]
           text-on-surface-secondary`,
    mark: 'size-[1.5rem] shrink-0 text-[color:var(--element)]',
  },
  package: {
    root: `flex items-center gap-x-[0.9rem] rounded-xl border border-[color:var(--element)]
           p-[var(--file-room,clamp(0.75rem,2.4vw,0.95rem))]
           bg-[color-mix(in_oklab,var(--element)_12%,var(--color-surface))]
           [&:hover]:bg-[color-mix(in_oklab,var(--element)_16%,var(--color-surface))]`,
    stack: `flex min-w-0 flex-1 flex-col gap-y-[0.05rem]
           @min-card-wide:flex-none @min-card-wide:max-w-[38rem]`,
    what: 'text-[clamp(1rem,3.6vw,1.15rem)] font-semibold leading-[1.35]',
    line: 'flex min-w-0 flex-wrap items-baseline gap-x-[0.55rem] text-on-surface-secondary',
    name: 'min-w-0 text-[0.85rem] leading-[1.45] [overflow-wrap:anywhere]',
    size: 'whitespace-nowrap tabular-nums text-[0.85rem] leading-[1.45]',
    mark: 'size-[1.6rem] shrink-0 text-[color:var(--element)]',
  },
  artifactSet: {
    root: `flex items-start gap-x-[0.9rem] rounded-xl border border-border px-[0.7rem]
           py-[0.6rem] [&:hover]:bg-hover-on-surface`,
    // The grid applies only when a description adds a second child; the condition
    // outranks the base by specificity, not emission order.
    stack: `flex min-w-0 flex-1 flex-wrap items-baseline gap-x-[0.7rem] gap-y-[0.05rem]
           grid-cols-[minmax(0,1fr)_auto] [&:has(>*+*)]:grid
           stage-tall:flex-none stage-tall:max-w-[26rem]`,
    what: 'col-start-1 row-start-1 text-[0.92rem] font-semibold leading-[1.35]',
    line: 'contents',
    name: `col-span-2 row-start-2 min-w-0 text-[0.82rem] leading-[1.45] text-on-surface-secondary
           [overflow-wrap:anywhere]`,
    size: `col-start-2 row-start-1 whitespace-nowrap tabular-nums text-[0.82rem] leading-[1.45]
           text-on-surface-secondary`,
    mark: 'mt-[0.15rem] size-[1.05rem] shrink-0 self-start text-[color:var(--element)]',
  },
  artifact: {
    root: `flex items-center gap-x-[0.9rem] rounded-xl border border-border px-[0.7rem]
           py-[0.6rem] [&:hover]:bg-hover-on-surface`,
    stack: 'flex min-w-0 flex-1 flex-col gap-y-[0.05rem]',
    what: 'text-[0.92rem] font-semibold leading-[1.35]',
    line: 'flex min-w-0 flex-wrap items-baseline gap-x-[0.55rem] text-on-surface-secondary',
    name: 'min-w-0 text-[0.82rem] leading-[1.45] [overflow-wrap:anywhere]',
    size: 'whitespace-nowrap tabular-nums text-[0.82rem] leading-[1.45]',
    mark: 'size-[1.05rem] shrink-0 text-[color:var(--element)]',
  },
  pieceSet: {
    root: `flex min-h-8 items-baseline gap-x-[0.45rem] rounded-lg border border-border
           bg-surface px-[0.55rem] py-1 text-[0.78rem]
           [&:hover]:bg-hover-on-surface`,
    stack: 'contents',
    what: '',
    line: 'contents',
    name: 'whitespace-nowrap',
    size: 'whitespace-nowrap tabular-nums text-[0.74rem] text-on-surface-secondary',
    mark: 'mt-[0.1rem] size-[0.9rem] shrink-0 self-start text-[color:var(--element)]',
  },
  piece: {
    root: `flex min-h-8 flex-wrap items-baseline gap-x-[0.45rem] gap-y-[0.1rem] rounded-lg
           border border-border-subtle px-[0.55rem] py-1 text-[0.78rem]
           [&:hover]:border-border [&:hover]:bg-hover-on-surface`,
    stack: 'contents',
    what: '',
    line: 'contents',
    name: 'min-w-0 [overflow-wrap:anywhere]',
    size: `ms-auto whitespace-nowrap tabular-nums text-[0.74rem] text-on-surface-secondary
           @min-card-wide:ms-0`,
    mark: 'mt-[0.1rem] size-[0.9rem] shrink-0 self-start text-[color:var(--element)]',
  },
  row: {
    root: `-ms-2 flex flex-wrap items-baseline gap-x-[0.7rem] gap-y-[0.1rem] rounded-[9px]
           px-2 py-[0.35rem] [&:hover]:bg-hover-on-surface`,
    stack: 'contents',
    what: '',
    line: 'contents',
    name: 'min-w-0 flex-[1_1_6rem] text-[0.85rem] [overflow-wrap:anywhere] desk:flex-[0_1_auto]',
    size: 'whitespace-nowrap tabular-nums text-[0.8rem] text-on-surface-secondary',
    mark: 'mt-[0.12rem] size-4 shrink-0 self-start text-[color:var(--element)]',
  },
  chip: {
    root: `flex min-h-8 flex-wrap items-baseline gap-x-[0.45rem] gap-y-[0.1rem] rounded-lg
           border border-border-subtle px-[0.55rem] py-1 text-[0.78rem]
           [&:hover]:border-border [&:hover]:bg-hover-on-surface`,
    stack: 'contents',
    what: '',
    line: 'contents',
    name: 'min-w-0 [overflow-wrap:anywhere]',
    size: `ms-auto whitespace-nowrap tabular-nums text-[0.74rem] text-on-surface-secondary
           @min-card-wide:ms-0`,
    mark: 'mt-[0.1rem] size-[0.9rem] shrink-0 self-start text-[color:var(--element)]',
  },
} satisfies Record<string, FileSkin>

defineProps<{
  name: string
  /** Size in bytes. */
  size: number
  url: string
  variant: keyof typeof VARIANT
  /** What the file is, in plain words, read before its name. */
  description?: string
}>()
</script>
