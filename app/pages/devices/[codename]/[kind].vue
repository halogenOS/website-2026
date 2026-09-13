<!-- Keep the width limit on the card, not the page, so the shared device header stays aligned across sub-pages. -->
<template>
  <SiteDeviceStage
    :device="device"
    :builds="served"
    :document-title="documentTitle"
    foot-fade
  >
    <template #default="{ builds }">
      <!-- Do not reserve foot clearance: it can force an otherwise fitting card to scroll. -->
      <div class="mt-(--lead-clearance) max-w-(--measure-content) desk:my-auto">
        <SiteBuildShelf
          v-for="card in newestOfKind(builds)"
          :key="card.kind"
          :build="card.build"
          :kind="card.kind"
          :codename="device.codename"
          :title-id="`featured-${card.kind}`"
        />

        <!-- Intent: device.noKindBuild explains that no build of this kind exists yet, without implying an error.
             device.everyBuild labels the link to the full history. -->
        <div
          v-if="newestOfKind(builds).length === 0"
          class="flex flex-col items-start gap-[0.85rem]"
        >
          <p class="max-w-(--measure-prose) text-[0.9rem] leading-relaxed text-on-bg">
            {{ t('device.noKindBuild') }}
          </p>
          <NuxtLink
            :to="historyPath"
            class="inline-flex min-h-11 items-center rounded-lg text-[0.82rem] text-on-bg
                   underline decoration-[color:var(--element)] decoration-2 underline-offset-4"
          >
            {{ t('device.everyBuild') }}
          </NuxtLink>
        </div>
      </div>
    </template>
  </SiteDeviceStage>
</template>

<script setup lang="ts">
import type { DeviceBuild } from '#shared/types/releases'

definePageMeta({ middleware: 'device-canonical' })

const { t } = useI18n()

const route = useRoute()
const device = routeDevice(route.params)

const kind = buildKindOf(String(route.params.kind ?? ''))
if (!kind) throw deviceAddressUnknown()

const served = await useDeviceBuilds(device.codename)

// A valid device with no build of this kind gets an empty state, not a 404.
const newestOfKind = (record: readonly DeviceBuild[]) =>
  featuredBuildsOf(record).filter(card => card.kind === kind)

const historyPath = deviceSectionPath(device, BUILD_HISTORY_SECTION)

// Intent: device.subpageTitle names the section and device for readers scanning tabs.
// The kind label matches the launcher entry; the device name is invariant data.
const documentTitle = computed(() =>
  t('device.subpageTitle', { section: t(kindLabelKey(kind)), device: device.name }))
</script>
