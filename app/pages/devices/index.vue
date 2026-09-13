<template>
  <SiteDepthPage
    depth="devices"
    padding-class="py-[clamp(0.85rem,2.2svh,2.2rem)]"
    gap-class="gap-[clamp(0.55rem,1.5svh,1.1rem)]"
    gate-in-view
  >
    <!-- Intent: devices.title names the devices with builds available now; the shell uses it for the h1 and tab
         title. -->
    <ul class="grid gap-[clamp(0.5rem,1.1svh,0.75rem)] desk:grid-cols-3">
      <li
        v-for="device in DEVICES"
        :key="device.codename"
      >
        <SiteDeviceCell
          :to="devicePath(device)"
          :name="device.name"
          :codename="device.codename"
          :last-build="summary?.devices[device.codename]?.lastBuild ?? device.lastBuild"
          :build-count="summary?.devices[device.codename]?.buildCount ?? device.buildCount"
        />
      </li>
    </ul>

    <template #tail>
      <!-- Intent: devices.tailLink labels the releases page containing every published build. -->
      <!-- Use full-contrast text: background flecks reduce secondary text contrast to 2.80:1. -->
      <NuxtLink
        :to="EVERY_BUILD_URL"
        class="inline-flex min-h-11 items-center self-start rounded-lg text-on-bg
               text-[0.82rem] underline decoration-[color:var(--element)] decoration-2 underline-offset-4"
      >{{ t('devices.tailLink') }}<ArrowRight
        aria-hidden="true"
        class="ms-0.5 size-3.5"
      /></NuxtLink>
    </template>
  </SiteDepthPage>
</template>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { DEVICES, devicePath, EVERY_BUILD_URL } from '#shared/data/devices'

const { t } = useI18n()

// Missing live data falls back to the device baseline without a visible error message.
const summary = await useReleaseSummary()
</script>
