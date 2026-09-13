<template>
  <UiIgnitableCell
    :to="to"
    :class="[ELEMENT_TONE[element], { '[view-transition-name:tapped]': tapped }]"
    surface="block backdrop-blur-sm px-3 pt-2 pb-4 min-h-table-cell
             desk:flex desk:flex-col desk:justify-between
             stage-wide:px-(--room-rem) stage-wide:pt-table-cell-wide-top
             stage-wide:pb-table-cell-wide-bottom
             stage-wide:min-h-table-cell-wide
             stage-tall:px-4 stage-tall:pt-table-cell-tall-top
             stage-tall:min-h-table-cell-tall stage-tall:pb-7"
  >
    <!-- Element facts are hidden from assistive tech; the name labels the link.
         The desk number and symbol share a baseline so iodine reads as a letter. -->
    <span
      aria-hidden="true"
      class="absolute inset-x-3 top-2 text-[color:var(--element)]
             desk:flex desk:items-baseline desk:justify-end desk:leading-none
             stage-wide:inset-x-(--room-rem) stage-wide:gap-x-table-lock-wide
             stage-wide:top-table-lock-wide-top stage-wide:-translate-y-1/2
             stage-tall:inset-x-4 stage-tall:gap-x-table-lock-tall stage-tall:top-table-lock-tall-top"
    >
      <!-- Stage-specific lengths are exclusive, independent of CSS emission order. -->
      <span
        class="absolute start-0 top-0 text-table-number tabular-nums desk:static
               stage-wide:text-table-number-wide
               stage-tall:text-table-number-tall"
      >{{ atomicNumber }}</span>
      <!-- Exclusive stage variants keep the glyph clear of the tube at 720 and 1080 heights. -->
      <span
        class="absolute end-0 -top-1 font-display text-table-symbol leading-none opacity-20
               ignited:opacity-90 desk:static desk:opacity-55
               stage-wide:text-table-symbol-wide
               stage-tall:text-table-symbol-tall
               motion-ok:transition-opacity motion-ok:duration-(--duration-cell)"
      >{{ symbol }}</span>
    </span>
    <!-- Parent padding cannot collapse like a first-child margin; contents exposes both desk flex items. -->
    <span class="relative block pt-table-name desk:contents">

      <span
        class="relative block text-table-name font-semibold leading-tight tracking-tight
               stage-wide:text-table-name-wide
               stage-tall:text-table-name-tall"
      >{{ label }}</span>
      <span
        aria-hidden="true"
        class="relative block mt-1 desk:mt-0 text-table-facts tracking-wide tabular-nums text-cell-ink-quiet
               stage-wide:text-table-facts-wide
               stage-tall:text-table-facts-tall"
      >{{ name }} &middot; {{ mass }}</span>
    </span>
    <!-- Entry strike delays vary by cell; the class supplies a finished default without script. -->
    <span
      aria-hidden="true"
      :style="{ '--strike-index': strikeIndex }"
      class="cell-tube absolute inset-x-table-tube-inset bottom-table-tube-bottom h-1.5 rounded-full opacity-80
             stage-wide:inset-x-table-tube-wide-inset stage-wide:bottom-table-tube-wide-bottom
             stage-wide:h-table-tube-wide
             ignited:opacity-100 motion-ok:transition-opacity motion-ok:duration-(--duration-cell)
             motion-entered:animate-strike
             motion-entered:[animation-delay:calc(var(--strike-index,0)*var(--duration-table-stagger))]"
    >
      <span
        class="cell-tube-lit absolute inset-0 rounded-full opacity-0 ignited:opacity-100
               motion-ok:transition-opacity motion-ok:duration-(--duration-cell)"
      />
    </span>
  </UiIgnitableCell>
</template>

<script setup lang="ts">
import type { HalogenSymbol } from '~/utils/elements'

defineProps<{
  /** Whether this cell supplies the table's departing snapshot. */
  tapped?: boolean
  /** Where the cell goes. */
  to: string
  /** The destination's name, already resolved from its i18n key by the caller. */
  label: string
  /** The element role this cell is lit in, the shared element list's tone map. */
  element: HalogenSymbol
  /** Element facts: the symbol, the atomic number, the name and the atomic mass. */
  symbol: string
  atomicNumber: number
  name: string
  mass: string
  /** This cell's place in the strike order, counted from zero. */
  strikeIndex: number
}>()
</script>
