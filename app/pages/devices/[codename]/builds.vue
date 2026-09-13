<!-- Name only the scroll region, not its enclosing card, to avoid duplicate landmarks. Include builds without
     files because they contribute to the published build count. -->
<template>
  <SiteDeviceStage
    :device="device"
    :builds="served"
    :document-title="documentTitle"
    column-class="flex h-full flex-col"
  >
    <!-- The column needs an exact height: a minimum alone lets the history expand instead of scrolling inside its
         card. -->
    <template #default="{ builds }">
      <!-- The minimum height keeps the history readable on short screens, where the outer column must scroll. -->
      <UiSolidCard
        class="mt-(--lead-clearance) flex min-h-[22rem] flex-1 flex-col"
        inner-class="flex min-h-0 flex-1 flex-col desk:[--card-foot:0px]"
      >
        <!-- Intent: device.everyBuild heads the full history: everything published for this device, newest first. -->
        <h2
          id="every-build"
          class="border-b border-border pb-[0.6rem] font-display text-[1.05rem] font-semibold
                 tracking-[0.01em] text-on-surface"
        >
          {{ t('device.everyBuild') }}
        </h2>

        <!-- At desk width, remove the card's bottom padding so fading rows meet its edge, not an empty strip. -->
        <UiScrollRegion
          labelled-by="every-build"
          foot-fade
          bounds-class="flex-1"
        >
          <section
            v-for="(group, index) in seriesGroupsOf(builds)"
            :key="index"
            class="mt-[clamp(1.1rem,3vh,1.6rem)] first:mt-[0.4rem]"
          >
            <!-- The series label is a version number, invariant data and not translated copy. -->
            <h3
              v-if="group.series"
              class="sticky top-0 z-[2] flex items-center gap-2 border-b border-border-subtle
                     bg-surface pb-[0.45rem] pt-[0.55rem] font-display text-[0.92rem]
                     font-semibold tracking-[0.04em] text-on-surface"
            >
              <span
                aria-hidden="true"
                class="h-[0.95em] w-[3px] rounded-[2px] bg-[var(--element)]"
              />{{ seriesLabel(group.series) }}
            </h3>
            <!-- Keep the decorative line outside the ordered list, which permits only list items. -->
            <div class="relative ps-[1.15rem]">
              <span
                aria-hidden="true"
                class="absolute bottom-0 start-0 top-6 w-px
                       bg-[linear-gradient(var(--color-border),var(--color-border-subtle)_12%_82%,transparent)]"
              />
              <ol class="list-none">
                <!-- Use the position in the full list for keys and anchors: distinct builds can share a
                     publication timestamp. -->
                <SiteBuildRow
                  v-for="placed in group.builds"
                  :key="placed.index"
                  :build="placed.build"
                  :index="placed.index"
                  :codename="device.codename"
                />
              </ol>
            </div>
          </section>
        </UiScrollRegion>
      </UiSolidCard>
    </template>
  </SiteDeviceStage>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'device-canonical' })

const { t } = useI18n()

const route = useRoute()
const device = routeDevice(route.params)

// SiteDeviceStage handles a null record and supplies slot content only when builds are available.
const served = await useDeviceBuilds(device.codename)

// Intent: device.subpageTitle names the history section and device for readers scanning tabs.
// device.everyBuild matches the history heading; the device name is invariant data.
const documentTitle = computed(() =>
  t('device.subpageTitle', { section: t('device.everyBuild'), device: device.name }))
</script>
