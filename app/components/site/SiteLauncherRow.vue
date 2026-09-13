<template>
  <NuxtLink
    :to="to"
    :class="toned ? [toneClass, TONE_WASH] : undefined"
    class="flex min-h-11 items-center gap-x-3 rounded-xl border border-border bg-surface
           px-[0.9rem] py-[0.6rem] text-inherit no-underline
           motion-safe:transition-colors motion-safe:duration-[180ms]
           [&:hover]:border-[color:var(--element)] [&:hover]:bg-hover-on-surface"
  >
    <span
      :class="toned ? 'text-[color:var(--element)]' : 'text-on-surface'"
      class="min-w-0 flex-1 font-display text-[0.95rem] font-semibold tracking-[0.01em]"
    >
      {{ label }}
    </span>
    <time
      v-if="publishedAt"
      :datetime="publishedAt"
      class="whitespace-nowrap text-[0.85rem] tabular-nums text-on-surface-secondary"
    >{{ longDate(publishedAt) }}</time>
    <!-- The arrow is decoration; the row's accessible name is its words and date. -->
    <ArrowRight
      aria-hidden="true"
      class="size-[1.05rem] shrink-0 text-[color:var(--element)]"
    />
  </NuxtLink>
</template>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'

const { longDate } = useBuildFormat()

// 12% of the element, gone by 62%: the contrast ratios were measured on this configuration and
// hold for no other.
const TONE_WASH = 'bg-linear-to-r to-transparent to-62%'
  + ' from-[color-mix(in_oklab,var(--element)_12%,transparent)] from-0%'

const props = defineProps<{
  /** The page this row opens. */
  to: string
  /** What that page is, in the words already written for it. */
  label: string
  /** The instant the row's own subject was published, where it has one. */
  publishedAt?: string
  /**
   * The class that hands this row its `--element`. Absent is a plain row. Any string is a
   * toned row, the empty one included: an empty tone keeps the inherited element, which is
   * how a stable entry wears the depth's own accent.
   */
  tone?: string
}>()

// The one test of that contract, so both bindings decide the same way.
const toned = computed(() => props.tone !== undefined)

// An empty class name is not a class.
const toneClass = computed(() => (props.tone === '' ? undefined : props.tone))
</script>
