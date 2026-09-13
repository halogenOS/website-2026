<!-- Inset focus clears the scrollport without covering tile borders.
     Bottom padding lets native focus scrolling expose fractional border edges. -->
<template>
  <!-- Intent: nav.label identifies global navigation, shared with the arrival's table. -->
  <nav
    :aria-label="t('nav.label')"
    data-rail
    class="pb-focus [&_a]:scroll-my-focus [&_a:focus-visible]:outline-offset-[calc(-2*var(--spacing-focus))]"
  >
    <SiteRailTiles
      :mark="mark"
      variant="rail"
    />
  </nav>
</template>

<script setup lang="ts">
import type { PlaceMark } from '~/utils/places'

const { t } = useI18n()

defineProps<{
  mark: PlaceMark
}>()
</script>
