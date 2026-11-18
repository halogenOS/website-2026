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

// Every variant is written out whole, never composed: two utilities for one CSS property on
// one element are decided by Tailwind's own order, not the order they are written in.
const VARIANT = {
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
