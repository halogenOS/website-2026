<template>
  <!-- Fixed date tracks must fit the longest kind label without wrapping and align file columns across rows. -->
  <li
    :id="buildAnchor(index)"
    class="relative scroll-mt-14 pb-[0.95rem] pt-[0.85rem]
           [&:not(:first-child)]:border-t [&:not(:first-child)]:border-border-subtle
           desk:grid desk:grid-cols-[13rem_minmax(0,1fr)] desk:items-start desk:gap-x-7
           trio:grid-cols-[11rem_minmax(0,1fr)]"
  >
    <span
      aria-hidden="true"
      :class="TICK[build.kind]"
      class="absolute start-[calc(-1.15rem_-_3px)] top-[1.35rem] size-[7px] rounded-full border"
    />

    <div class="flex flex-wrap items-baseline gap-x-[0.7rem] gap-y-1 desk:flex-col desk:items-start desk:gap-[0.15rem]">
      <time
        :datetime="build.publishedAt"
        class="whitespace-nowrap font-display text-[0.95rem] font-semibold tabular-nums"
      >{{ shortDate(build.publishedAt) }}</time>
      <!-- Intent: device.kind.stable, .candidate and .test are the three build kinds as
           short labels a scanning reader tells apart instantly: the safe everyday
           choice, the nearly-stable one, the experimental one. -->
      <span :class="KIND_INK[build.kind]">{{ t(kindLabelKey(build.kind)) }}</span>
      <!-- Intent: device.notes is the link to this build's own release notes on the
           forge. -->
      <a
        :href="build.notesUrl"
        class="text-[0.8rem] text-on-surface-secondary underline decoration-[color:var(--element)]
               decoration-2 underline-offset-4"
      >{{ t('device.notes') }}</a>
    </div>

    <div class="mt-[0.4rem] desk:mt-0">
      <UiFileLink
        v-if="rom"
        :name="rom.name"
        :size="rom.size"
        :url="rom.url"
        variant="row"
      />
      <!-- Trio is the first width that fits five chips on one line; the cap prevents a lone chip filling the row. -->
      <ul
        v-if="pieces.length > 0"
        class="mt-[0.35rem] flex flex-wrap gap-[0.3rem]"
      >
        <li
          v-for="file in pieces"
          :key="file.url"
          class="trio:max-w-[22rem] trio:flex-[1_1_auto]"
        >
          <UiFileLink
            :name="file.name"
            :size="file.size"
            :url="file.url"
            variant="chip"
          />
        </li>
      </ul>
      <!-- Intent: device.noFiles states that this listed build shipped nothing to
           download, without reading as an error. -->
      <p
        v-if="build.files.length === 0"
        class="inline-block rounded-lg border border-dashed border-border px-[0.6rem] py-[0.3rem]
               text-[0.8rem] text-on-surface-secondary"
      >
        {{ t('device.noFiles') }}
      </p>
    </div>
  </li>
</template>

<script setup lang="ts">
import type { BuildKind, DeviceBuild } from '#shared/types/releases'

const { t } = useI18n()
const { shortDate } = useBuildFormat()

// Each kind states fill and border together, because two utilities for one property on
// one element are ordered by Tailwind, not by source.
const TICK: Record<BuildKind, string> = {
  stable: 'bg-[var(--element)] border-[color:var(--element)]',
  candidate: 'bg-[color-mix(in_oklab,var(--element)_45%,var(--color-surface))] border-[color:var(--element)]',
  test: 'bg-surface border-border',
}

const KIND_LABEL = 'font-display text-[0.7rem] uppercase tracking-[0.14em]'
const KIND_INK: Record<BuildKind, string> = {
  stable: `${KIND_LABEL} font-semibold text-on-surface`,
  candidate: `${KIND_LABEL} font-medium text-on-surface-secondary`,
  test: `${KIND_LABEL} font-medium text-on-surface-secondary`,
}

const props = defineProps<{
  build: DeviceBuild
  /** Use the position in the complete device history so anchors remain consistent. */
  index: number
  codename: string
}>()

const rom = computed(() => packageOf(props.build, props.codename))
const pieces = computed(() => piecesOf(props.build, props.codename))
</script>
