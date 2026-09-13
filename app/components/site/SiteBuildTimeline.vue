<template>
  <section :aria-labelledby="labelId">
    <!-- Height variants must be mutually exclusive to avoid competing Tailwind utilities. -->
    <div
      class="relative h-[clamp(2.5rem,7vh,3.5rem)]
             stage-wide:h-[clamp(2rem,calc(26vh-152px),9rem)]
             stage-tall:h-[clamp(3.5rem,7svh,10rem)]
             rounded-lg border border-border-subtle bg-surface
             bg-linear-to-b from-[color-mix(in_oklab,var(--element)_12%,transparent)] from-0%
             to-transparent to-74%"
    >
      <!-- The history provides every build in full, so marks are hidden from assistive technology.
           Index keys are necessary because multiple builds can share a publication timestamp. -->
      <span
        v-for="(build, index) in builds"
        :key="index"
        aria-hidden="true"
        :style="{ '--at': ageOf(build) }"
        :class="[kindElementStepAtDesk(build.kind), MARK_FILL[build.kind],
                 MARK_WIDTH[build.kind], MARK_LIFT[build.kind], TRACK_DEPTH[build.kind]]"
        class="absolute bottom-[3px] rounded-[1px]
               [inset-inline-end:calc(4px_+_(100%_-_10px)_*_var(--at,0))]"
      />
    </div>

    <div class="mt-[0.4rem] flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <template v-if="ends">
        <!-- Intent: device.capOldest and device.capNewest identify which end each month names for non-visual
             readers. -->
        <p :class="CAP_QUIET">
          <span class="sr-only">{{ t('device.capOldest') }}</span>
          {{ ends.oldest }}
        </p>
        <div class="flex flex-wrap items-baseline gap-x-[1.9rem] gap-y-1">
          <!-- Intent: device.timeline names the timeline: one mark per published build across the labelled months. -->
          <h2
            :id="labelId"
            :class="CAP"
            class="sr-only text-on-bg desk:not-sr-only"
          >
            {{ t('device.timeline') }}
          </h2>
          <!-- Intent: device.kind.stable, .candidate and .test name the build kinds beside their timeline marks. -->
          <ul
            aria-hidden="true"
            class="hidden list-none gap-x-[0.9rem] gap-y-1 desk:flex desk:flex-wrap"
          >
            <li
              v-for="kind in LEGEND_KINDS"
              :key="kind"
              :class="CAP_QUIET"
              class="flex items-center gap-[0.35rem]"
            >
              <span class="flex h-[1.15rem] w-[0.8rem] shrink-0 items-end">
                <span
                  :class="[kindElementStepAtDesk(kind), MARK_FILL[kind], KEY_WIDTH[kind], KEY_DEPTH]"
                  class="rounded-[2px]"
                />
              </span>
              {{ t(kindLabelKey(kind)) }}
            </li>
          </ul>
        </div>
        <p :class="CAP_QUIET">
          <span class="sr-only">{{ t('device.capNewest') }}</span>
          {{ ends.newest }}
        </p>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { BuildKind, DeviceBuild } from '#shared/types/releases'

const { t } = useI18n()
const { monthAndYear } = useBuildFormat()

// Keep colour outside CAP so each element receives only one text-colour utility.
const CAP = `whitespace-nowrap font-display text-[clamp(0.56rem,1.9vw,0.64rem)] font-semibold
  uppercase tracking-[0.12em]`
const CAP_QUIET = `${CAP} text-on-bg-secondary`

const LEGEND_KINDS = FEATURED_KINDS

const MARK_FILL: Record<BuildKind, string> = {
  stable: 'bg-[var(--element)]',
  candidate: 'bg-[color-mix(in_oklab,var(--element)_70%,var(--color-bg))]',
  test: 'bg-[color-mix(in_oklab,var(--element)_55%,var(--color-bg))]',
}

// Colour alone cannot distinguish the narrow marks, so stroke width must also identify kinds.
const MARK_WIDTH: Record<BuildKind, string> = {
  stable: 'w-[3px] desk:w-[6px]',
  candidate: 'w-[2px] desk:w-[4px]',
  test: 'w-[2px]',
}

// Stable builds must remain visible where marks overlap.
// Candidate stacking applies only at desktop widths, where equal-height marks can hide each other completely.
const MARK_LIFT: Record<BuildKind, string> = {
  stable: 'z-[2]',
  candidate: 'desk:z-[1]',
  test: '',
}

// The 8px subtraction leaves room for rounded corners.
// Desktop marks have equal height so height does not imply a quantity for build kinds.
const TRACK_DEPTH: Record<BuildKind, string> = {
  stable: 'h-[calc(100%-8px)]',
  candidate: 'h-[62%] desk:h-[calc(100%-8px)]',
  test: 'h-[38%] desk:h-[calc(100%-8px)]',
}

const KEY_DEPTH = 'h-full'

const KEY_WIDTH: Record<BuildKind, string> = {
  stable: 'w-full',
  candidate: 'w-4/6',
  test: 'w-2/6',
}

const props = defineProps<{
  /** Requires a nonempty history, newest first; the caller omits the timeline when no builds exist. */
  builds: readonly DeviceBuild[]
  /** Must be unique per page. */
  labelId: string
}>()

const span = computed(() => {
  const newest = Date.parse(props.builds[0]?.publishedAt ?? '')
  const oldest = Date.parse(props.builds.at(-1)?.publishedAt ?? '')
  return { newest, width: newest - oldest }
})

const ageOf = (build: DeviceBuild): number => {
  const { newest, width } = span.value
  return width > 0 ? (newest - Date.parse(build.publishedAt)) / width : 0
}

const ends = computed(() => {
  const oldest = props.builds.at(-1)
  const newest = props.builds[0]
  if (!oldest || !newest) return null
  return { oldest: monthAndYear(oldest.publishedAt), newest: monthAndYear(newest.publishedAt) }
})
</script>
