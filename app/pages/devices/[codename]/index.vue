<!-- Both responsive presentations must exist in SSR because the server cannot know the viewport width. -->
<template>
  <SiteDeviceStage
    :device="device"
    :builds="served"
    foot-fade
  >
    <!-- Keep the top-margin ranges exclusive; overlapping range variants would leave the margin to Tailwind
         emission order. -->
    <template #aside>
      <SiteBuildTimeline
        v-if="served"
        :builds="served"
        label-id="build-timeline"
        class="max-desk:mt-[clamp(0.85rem,2.4vh,1.3rem)] desk:max-trio:mt-[clamp(0.6rem,1.6vh,1.3rem)]"
      />
    </template>

    <template #default>
      <div class="stage-wide:my-auto stage-tall:flex stage-tall:flex-1 stage-tall:flex-col">
        <!-- Do not reserve foot clearance: padding alone can cause overflow and dim cards that otherwise fit. -->
        <!-- Keep the history entry after the kind entries in DOM order, even when the grid places it beside the
             heading. -->
        <section
          aria-labelledby="latest-builds"
          class="mt-(--lead-clearance) desk:mt-[clamp(0.5rem,1.2vh,1.25rem)]
                 stage-wide:grid stage-wide:grid-cols-[minmax(0,1fr)_auto] stage-wide:items-end
                 stage-tall:flex stage-tall:flex-1 stage-tall:flex-col"
        >
          <!-- Intent: device.latestBuilds heads the newest build of each kind, with each entry opening its
               download page. -->
          <!-- Size the heading against viewport height so short screens leave more room for the download cards. -->
          <h2
            id="latest-builds"
            class="font-display text-[1.05rem] font-semibold tracking-[0.01em] text-on-bg
                   stage-wide:col-start-1 stage-wide:row-start-1
                   desk:text-[clamp(1.2rem,3.3svh,1.7rem)] desk:leading-[1.2] desk:tracking-[-0.01em]"
          >
            {{ t('device.latestBuilds') }}
          </h2>

          <!-- Scope width-based arrangement rules to stage-wide: on tall screens they conflict with stage-
               tall:contents and can collapse follower cards. The 1.15:1 column ratio leaves room for follower file
               chips on one line; wrapping them can force scrolling at 1920×1080. -->
          <!-- Do not distribute cards through the tall column: surplus height must stay below the set, not between
               cards. -->
          <div
            v-if="featured.lead"
            class="mt-[clamp(0.55rem,1.5vh,1.1rem)] hidden gap-launcher-gap
                   stage-wide:col-span-2 stage-wide:row-start-2
                   desk:flex desk:flex-col
                   stage-wide:trio:flex-row stage-wide:trio:items-start
                   stage-tall:gap-tall-rhythm"
          >
            <SiteBuildShelf
              :build="featured.lead.build"
              :kind="featured.lead.kind"
              :codename="device.codename"
              :title-id="`featured-${featured.lead.kind}`"
              :to="sectionPath(featured.lead.kind)"
              class="desk:[--card-room-set:clamp(1rem,3.2svh,2.4rem)]
                     stage-wide:trio:min-w-0 stage-wide:trio:flex-[1.15_1_0]"
              role="lead"
            />
            <div
              v-if="featured.followers.length > 0"
              class="flex flex-col gap-launcher-gap
                     stage-tall:contents
                     stage-wide:trio:gap-[0.55rem]
                     stage-wide:pair:flex-row stage-wide:pair:items-start
                     stage-wide:trio:min-w-0 stage-wide:trio:flex-col
                     stage-wide:trio:items-stretch stage-wide:trio:flex-[1_1_0]"
            >
              <SiteBuildShelf
                v-for="card in featured.followers"
                :key="card.kind"
                :build="card.build"
                :kind="card.kind"
                :codename="device.codename"
                :title-id="`featured-${card.kind}`"
                :to="sectionPath(card.kind)"
                class="stage-wide:pair:min-w-0 stage-wide:pair:flex-1 stage-wide:trio:flex-none
                       stage-tall:ms-[clamp(2rem,6vw,4rem)] stage-tall:me-[clamp(1rem,3vw,2rem)]"
                role="follower"
              />
            </div>
          </div>

          <!-- Use exclusive stage variants for placement and margins so conflicting values do not depend on
               Tailwind order. -->
          <ul
            class="mt-[clamp(0.6rem,1.8vh,0.9rem)] flex list-none flex-col gap-[0.45rem]
                   stage-wide:col-start-2 stage-wide:row-start-1 stage-wide:mt-0
                   stage-wide:justify-self-end
                   stage-tall:mt-tall-rhythm"
          >
            <!-- Intent: device.kind.stable, .candidate and .test distinguish build kinds with short labels
                 matching the history rows. -->
            <li
              v-for="card in featured.all"
              :key="card.kind"
              class="desk:hidden"
            >
              <SiteLauncherRow
                :to="sectionPath(card.kind)"
                :label="t(kindLabelKey(card.kind))"
                :published-at="card.build.publishedAt"
                :tone="kindElementStep(card.kind)"
              />
            </li>
            <!-- Intent: device.allBuilds labels the full-history link, distinct from the individual build kinds. -->
            <li>
              <SiteLauncherRow
                :to="sectionPath(BUILD_HISTORY_SECTION)"
                :label="t('device.allBuilds')"
              />
            </li>
          </ul>
        </section>
      </div>
    </template>
  </SiteDeviceStage>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'device-canonical' })

const { t } = useI18n()

const route = useRoute()
const device = routeDevice(route.params)

// SiteDeviceStage handles null when neither the cache nor upstream can supply a usable device record.
const served = await useDeviceBuilds(device.codename)

const featured = computed(() => {
  const all = served === null ? [] : featuredBuildsOf(served)
  return { all, lead: all[0], followers: all.slice(1) }
})

const sectionPath = (section: string) => deviceSectionPath(device, section)
</script>
