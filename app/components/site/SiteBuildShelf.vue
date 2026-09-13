<template>
  <UiSolidCard
    :aria-labelledby="titleId"
    :backing="backing"
    :class="[kindElementStep(kind), CARD_ROOM[role]]"
    :inner-class="FRAME[role]"
  >
    <template #light>
      <span
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent
               via-[color-mix(in_oklab,var(--element)_62%,transparent)] via-34% to-transparent to-82%"
      />
      <span
        v-if="wash"
        aria-hidden="true"
        :class="wash"
        class="pointer-events-none absolute inset-0 bg-linear-to-b
               from-[color-mix(in_oklab,var(--element)_var(--wash,12%),transparent)] from-0%
               to-transparent to-62% motion-ok:animate-breathe"
      />
      <span
        v-if="role !== 'alone'"
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 start-0 flex w-[6px] items-end"
      >
        <span
          :class="kindRail(kind)"
          class="w-full"
        />
      </span>
    </template>

    <!-- Only the heading links to the build page; the card contains file links and must not wrap them in
         another link. -->
    <h2
      :id="titleId"
      :class="HEAD[role]"
      class="font-display font-semibold tracking-[-0.01em]
             @min-card-wide:col-start-1 @min-card-wide:pe-[clamp(1.5rem,3vw,2.5rem)]"
    >
      <component
        :is="to ? NuxtLink : 'span'"
        :to="to"
        :class="HEAD_GAP[role]"
        class="flex flex-wrap items-baseline gap-y-1 text-inherit no-underline
               [&:hover]:underline [&:hover]:decoration-[color:var(--element)]
               [&:hover]:decoration-2 [&:hover]:underline-offset-4"
      >
        <!-- Intent: device.latestStable, .latestCandidate and .latestTest label the newest build of each kind.
             Stable is the default recommendation; the others offer newer, less-tested builds. -->
        <span
          :class="KIND_LINE[role]"
          class="font-display font-semibold text-[color:var(--element)]"
        >{{ t(FEATURED_LABEL[kind]) }}</span>
        <time :datetime="build.publishedAt">{{ longDate(build.publishedAt) }}</time>
        <span
          v-if="build.series"
          class="text-[0.82rem] font-semibold tracking-[0.06em] text-on-surface-secondary"
        >{{ seriesLabel(build.series) }}</span>
      </component>
    </h2>

    <!-- Every build file must appear, including files without a description mapping. -->
    <div
      v-if="build.files.length > 0"
      :class="FILES[role]"
    >
      <!-- Intent: device.artifactPackage identifies the flashable system archive without requiring filename
           knowledge. -->
      <UiFileLink
        v-if="files.rom"
        :class="PACKAGE_ROOM[role]"
        :name="files.rom.name"
        :size="files.rom.size"
        :url="files.rom.url"
        :description="t('device.artifactPackage')"
        :variant="PACKAGE_VARIANT[role]"
      />

      <!-- Intent: device.artifactBoot, .artifactVendorBoot and .artifactRecovery identify flashable repair images.
           Files absent from the description mapping still appear without descriptions. -->
      <ul
        v-if="files.artifacts.length > 0"
        :class="ARTIFACT_LINE[role]"
        class="list-none"
      >
        <li
          v-for="artifact in files.artifacts"
          :key="artifact.file.url"
          :class="ARTIFACT_ITEM[role]"
        >
          <UiFileLink
            :name="artifact.file.name"
            :size="artifact.file.size"
            :url="artifact.file.url"
            :description="role === 'follower' ? undefined : describe(artifact)"
            :variant="ARTIFACT_VARIANT[role]"
          />
        </li>
      </ul>

      <ul
        v-if="files.support.length > 0"
        :class="SUPPORT_LINE[role]"
        class="list-none"
      >
        <li
          v-for="file in files.support"
          :key="file.url"
          :class="SUPPORT_ITEM[role]"
        >
          <UiFileLink
            :name="file.name"
            :size="file.size"
            :url="file.url"
            :variant="SUPPORT_VARIANT[role]"
          />
        </li>
      </ul>
    </div>

    <!-- Intent: device.noFiles states that a listed build has no downloads, without implying an error. -->
    <p
      v-else
      :class="NOTE_PLACE[role]"
      class="inline-block rounded-lg border border-dashed
             border-border px-[0.6rem] py-[0.3rem] text-[0.8rem] text-on-surface-secondary
             @min-card-wide:place-self-start"
    >
      {{ t('device.noFiles') }}
    </p>

    <!-- Keep the notes link last in document order at every width so assistive technology follows the file order. -->
    <div
      :class="NOTES[role]"
      class="flex flex-wrap items-baseline gap-x-[1.1rem] gap-y-[0.4rem] text-[0.88rem]
             @min-card-wide:col-start-2 @min-card-wide:self-end @min-card-wide:mt-0
             @min-card-wide:border-t-0 @min-card-wide:pt-0"
    >
      <!-- Intent: device.notes links to this build's release notes on the forge. -->
      <a
        :href="build.notesUrl"
        class="underline decoration-[color:var(--element)] decoration-2 underline-offset-4"
      >{{ t('device.notes') }}</a>
    </div>
  </UiSolidCard>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'
import type { BuildKind, DeviceBuild } from '#shared/types/releases'
import type { FeaturedArtifact } from '~/utils/builds'

const { t } = useI18n()
const { longDate } = useBuildFormat()

const FEATURED_LABEL: Record<BuildKind, string> = {
  stable: 'device.latestStable',
  candidate: 'device.latestCandidate',
  test: 'device.latestTest',
}

const props = withDefaults(defineProps<{
  /** The newest build of this kind; omit the component when none exists. */
  build: DeviceBuild
  kind: BuildKind
  codename: string
  /** Must be unique per page. */
  titleId: string
  /** Omit on the destination page to avoid a self-link. */
  to?: string
  /** The parent assigns the role; the shelf must not infer it from sibling count. */
  role?: ShelfRole
}>(), { role: 'alone' })

const backing = computed(() => (props.role === 'alone' ? 'solid' : kindCardBacking(props.kind)))

const wash = computed(() => (backing.value === 'outline' ? null : WASH[props.role]))

const files = computed(() => featuredFilesOf(props.build, props.codename))

// An empty description key is a locale defect, not an absent description.
const describe = (artifact: FeaturedArtifact): string | undefined =>
  artifact.description === undefined ? undefined : t(artifact.description)
</script>
