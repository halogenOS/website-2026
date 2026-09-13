<!-- Native popover focus and dismissal must work without page scripts. -->
<template>
  <!-- Intent: nav.openMenu names the action of the symbol-only control. -->
  <button
    type="button"
    popovertarget="site-menu"
    :aria-label="t('nav.openMenu')"
    data-menu
    :class="'element' in mark
      ? [ELEMENT_TONE[mark.element.symbol], 'border-[color:var(--element)]']
      : 'border-border'"
    class="relative -mt-0.5 size-interaction flex-none overflow-hidden rounded-cell border bg-surface
           text-on-surface desk:hidden"
  >
    <template v-if="'element' in mark">
      <span
        aria-hidden="true"
        class="absolute start-menu-inset top-menu-number text-menu-number leading-none tabular-nums
               text-[color:var(--element)]"
      >{{ mark.element.number }}</span>
      <span
        aria-hidden="true"
        class="absolute end-menu-inset bottom-menu-symbol font-display text-menu-symbol font-medium
               leading-none text-[color:var(--element)] opacity-90"
      >{{ mark.element.symbol }}</span>
      <span
        aria-hidden="true"
        class="cell-tube absolute inset-x-menu-tube bottom-1 h-menu-tube-height rounded-tube"
      >
        <span class="cell-tube-lit absolute inset-0 rounded-tube" />
      </span>
    </template>
    <!-- Intent: the page's initials identify a neutral page visually; the aria-label names the action. -->
    <span
      v-else
      aria-hidden="true"
      class="absolute end-menu-inset bottom-menu-symbol font-display text-menu-symbol font-medium leading-none"
    >{{ t(mark.initialsKey) }}</span>
  </button>

  <!-- Intent: nav.menuLabel identifies the site's menu landmark. -->
  <nav
    id="site-menu"
    popover="auto"
    :aria-label="t('nav.menuLabel')"
    data-sheet
    class="inset-x-0 top-auto bottom-0 m-0 h-auto max-h-menu-sheet w-auto overflow-y-auto
           rounded-t-menu-sheet border-0 border-t border-border bg-surface px-(--stage-pad)
           pt-menu-head pb-menu-foot text-on-surface backdrop:bg-scrim
           desk:hidden desk:backdrop:hidden"
  >
    <div class="mb-menu-head flex items-start justify-between gap-4">
      <SiteTrail
        :crumbs="trail"
        variant="sheet"
      />
      <!-- Intent: nav.closeMenu names the action of the cross-only control.
           Native autofocus enters the sheet and lets dismissal restore the invoking control. -->
      <button
        type="button"
        autofocus
        popovertarget="site-menu"
        popovertargetaction="hide"
        :aria-label="t('nav.closeMenu')"
        class="inline-flex size-interaction flex-none items-center justify-center rounded-menu-close
               border border-border text-on-surface hover:bg-hover-on-surface"
      >
        <X
          aria-hidden="true"
          class="size-menu-close"
        />
      </button>
    </div>
    <SiteRailTiles
      :mark="mark"
      variant="sheet"
    />
  </nav>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import type { Crumb, PlaceMark } from '~/utils/places'

const { t } = useI18n()

defineProps<{
  mark: PlaceMark
  trail: readonly Crumb[]
}>()
</script>
