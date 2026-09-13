<template>
  <SiteDepthPage
    depth="device"
    :title="device.name"
    :document-title="documentTitle"
    measure-class="max-w-(--measure-content) trio:max-w-(--measure-wide)"
    heading-class="text-device-heading leading-device-heading wide:text-device-heading-wide"
    padding-class="py-depth"
    gap-class="gap-device-heading"
    align-class="justify-center-safe desk:justify-start"
  >
    <UiScrollRegion
      labelled-by="depth-heading"
      bounds-class="flex-1"
      :inner-class="columnClass ?? 'desk:flex desk:min-h-full desk:flex-col'"
      :foot-fade="footFade"
    >
      <!-- Only an aside needs the band's column layout. -->
      <div
        :class="$slots.aside ? IDENTITY_BAND : ''"
      >
        <SiteDeviceHeader :codename="device.codename" />
        <slot name="aside" />
      </div>

      <template v-if="builds">
        <slot :builds="builds" />
      </template>

      <!-- Intent: device.unavailable is the state when live release data cannot be served. It
           must not blame the reader, must not fake emptiness, and must hand them the path that
           still works; device.unavailableLink labels that off-site listing. -->
      <div
        v-else
        class="mt-device-unavailable flex flex-col items-start gap-device-unavailable-gap
               pb-(--foot-clearance) desk:my-auto"
      >
        <p class="max-w-(--measure-prose) text-device-unavailable leading-relaxed text-on-bg">
          {{ t('device.unavailable') }}
        </p>
        <a
          :href="EVERY_BUILD_URL"
          class="inline-flex min-h-interaction min-w-interaction items-center rounded-lg
                 text-device-unavailable-link text-on-bg underline
                 decoration-[color:var(--element)] decoration-2 underline-offset-4"
        >{{ t('device.unavailableLink') }}</a>
      </div>
    </UiScrollRegion>
  </SiteDepthPage>
</template>

<script setup lang="ts">
import type { Device } from '#shared/data/devices'
import { EVERY_BUILD_URL } from '#shared/data/devices'
import type { DeviceBuild } from '#shared/types/releases'

const { t } = useI18n()

// The codename keeps its intrinsic width; an aside takes the remaining track at trio width.
const IDENTITY_BAND = `trio:grid trio:grid-cols-[auto_minmax(0,1fr)] trio:items-start
                       trio:gap-x-device-identity`

defineProps<{
  /** The device every page in this stage is about. */
  device: Device
  /** Its whole published history, newest first, or `null` when none can be served. */
  builds: readonly DeviceBuild[] | null
  /** The tab's own words for a section page; the launcher names itself by the device. */
  documentTitle?: string
  /** The scrolled column's layout override, for a page whose content fills the column. */
  columnClass?: string
  /** Whether the column fades past the stage's foot; the region applies it only when it overflows. */
  footFade?: boolean
}>()

// The content receives builds already known to exist; the stage answers the absent case itself.
defineSlots<{
  default: (props: { builds: readonly DeviceBuild[] }) => unknown
  /** What stands beside the codename at the wide measure; absent renders the identity block alone. */
  aside?: () => unknown
}>()
</script>
