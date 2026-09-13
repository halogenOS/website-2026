<!-- The number and symbol share a baseline so iodine reads as a letter.
     Navigation is lit at rest or on interaction, never with an arrival strike. -->
<template>
  <UiIgnitableCell
    :to="element.to"
    :lit="current"
    :aria-current="current ? 'true' : undefined"
    :class="ELEMENT_TONE[element.symbol]"
    :surface="`flex flex-col justify-end ${SIZE[variant].surface}`"
  >
    <span
      aria-hidden="true"
      class="absolute end-2 top-rail-lock-top flex items-baseline gap-rail-lock leading-none
             text-[color:var(--element)]"
    >
      <span
        :class="SIZE[variant].number"
        class="tabular-nums"
      >{{ element.number }}</span>
      <span
        :class="SIZE[variant].symbol"
        class="font-display font-medium leading-none opacity-55 ignited:opacity-90
               motion-ok:transition-opacity motion-ok:duration-(--duration-cell)"
      >{{ element.symbol }}</span>
    </span>
    <!-- Intent: the destination key names the section this tile opens, not its chemical element. -->
    <span
      :class="SIZE[variant].name"
      class="relative font-display font-semibold leading-navigation tracking-navigation"
    >{{ t(element.key) }}</span>
    <span
      aria-hidden="true"
      class="cell-tube opacity-80 absolute inset-x-2 bottom-rail-tube h-1 rounded-tube
             ignited:opacity-100 motion-ok:transition-opacity motion-ok:duration-(--duration-cell)"
    >
      <span
        class="cell-tube-lit opacity-0 absolute inset-0 rounded-tube ignited:opacity-100
               motion-ok:transition-opacity motion-ok:duration-(--duration-cell)"
      />
    </span>
  </UiIgnitableCell>
</template>

<script setup lang="ts">
import type { Halogen } from '~/utils/elements'

const { t } = useI18n()

const SIZE = {
  rail: {
    surface: 'w-18 min-h-20 px-rail-pad-x pt-rail-pad-top pb-rail-pad-bottom'
      + ' wide:w-20 wide:min-h-22',
    number: 'text-rail-number wide:text-rail-number-wide',
    symbol: 'text-rail-symbol wide:text-rail-symbol-wide',
    name: 'text-rail-name wide:text-rail-name-wide',
  },
  sheet: {
    surface: 'min-h-22 px-rail-pad-x pt-rail-pad-top pb-rail-pad-bottom-sheet',
    number: 'text-rail-number-wide',
    symbol: 'text-rail-symbol-wide',
    name: 'text-rail-name-sheet',
  },
} as const

defineProps<{
  element: Halogen
  current: boolean
  variant: keyof typeof SIZE
}>()
</script>
