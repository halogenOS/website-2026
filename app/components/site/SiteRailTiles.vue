<template>
  <div :class="LAYOUT[variant].root">
    <!-- The group number is language-invariant element data, not an action label. -->
    <span
      aria-hidden="true"
      :class="LAYOUT[variant].group"
      class="font-display text-rail-group font-semibold tracking-rail-group tabular-nums text-accent"
    >{{ HALOGEN_GROUP }}</span>
    <ul :class="LAYOUT[variant].list">
      <li
        v-for="halogen in HALOGENS"
        :key="halogen.symbol"
      >
        <SiteRailTile
          :element="halogen"
          :current="'element' in mark && mark.element.symbol === halogen.symbol"
          :variant="variant"
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { PlaceMark } from '~/utils/places'

const LAYOUT = {
  rail: {
    root: 'flex flex-col gap-2',
    group: 'flex min-h-rail-group items-center justify-center',
    list: 'flex flex-col gap-2',
  },
  sheet: {
    root: '',
    group: 'mb-menu-group block',
    list: 'grid grid-cols-2 gap-menu-grid',
  },
} as const

defineProps<{
  mark: PlaceMark
  variant: keyof typeof LAYOUT
}>()
</script>
