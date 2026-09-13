<template>
  <SiteDepthPage
    depth="features"
    padding-class="py-[clamp(0.7rem,1.8svh,2.2rem)]"
    gap-class="gap-[clamp(0.55rem,1svh,1.1rem)]"
  >
    <!-- Intent: features.title summarizes the three project priorities; the shell uses it for the h1 and tab
         title. -->
    <ul class="grid gap-[clamp(0.5rem,1.1svh,0.75rem)] desk:grid-cols-3">
      <li
        v-for="feature in FEATURES"
        :key="feature.name"
      >
        <SiteFeatureCell
          :mark="feature.mark"
          :paint="feature.paint"
          :name="t(feature.name)"
          :claim="t(feature.claim)"
        />
      </li>
    </ul>
  </SiteDepthPage>
</template>

<script setup lang="ts">
const { t } = useI18n()

// Intent: features.performance, features.batteryLife and features.stability name speed, endurance and
// dependability.
// Keep their grammar consistent as a set.
// Intent: features.performanceBody describes ongoing work on speed and responsiveness, not a benchmark or
// comparison.
// Intent: features.batteryLifeBody says speed improvements must preserve and improve battery endurance.
// Intent: features.stabilityBody says bugs and crashes take priority and changes are tested before publication.
const FEATURES = [
  {
    mark: '/mark-performance.svg',
    paint: '--feature-performance',
    name: 'features.performance',
    claim: 'features.performanceBody',
  },
  {
    mark: '/mark-battery.svg',
    paint: '--feature-battery',
    name: 'features.batteryLife',
    claim: 'features.batteryLifeBody',
  },
  {
    mark: '/mark-stability.svg',
    paint: '--feature-stability',
    name: 'features.stability',
    claim: 'features.stabilityBody',
  },
] as const
</script>
