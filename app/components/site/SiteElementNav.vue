<template>
  <!-- Intent: nav.label names the arrival navigation landmark for assistive technology. -->
  <nav :aria-label="t('nav.label')">
    <div
      class="grid items-stretch gap-table
        grid-cols-(--table-tracks-phone)
        desk:grid-cols-[auto_repeat(2,var(--nav-ghost))_var(--nav-lit)_var(--nav-ghost)]
        stage-wide:[--type-floor:var(--text-table-floor)] stage-wide:gap-table-wide
        stage-wide:[--nav-ghost:var(--table-ghost-wide)]
        stage-wide:[--nav-lit:var(--table-lit-wide)]
        stage-tall:[--nav-ghost:var(--table-ghost-tall)]
        stage-tall:[--nav-lit:var(--table-lit-tall)]"
    >
      <span
        aria-hidden="true"
        class="min-h-rail-group stage-wide:min-h-table-group-wide"
      />
      <span
        v-for="(group, column) in GROUPS"
        :key="group"
        aria-hidden="true"
        :class="[
          column === 0 ? NARROW_HIDDEN : '',
          group === HALOGEN_GROUP
            ? 'text-accent font-semibold tracking-rail-group'
            : 'text-on-bg-secondary/70 tracking-table-number',
        ]"
        class="flex min-h-rail-group items-center justify-center text-rail-group tabular-nums
               stage-wide:min-h-table-group-wide stage-wide:leading-none
               stage-wide:text-table-group-wide"
      >{{ group }}</span>

      <template
        v-for="(row, index) in rows"
        :key="row.period"
      >
        <span
          aria-hidden="true"
          class="flex min-w-table-period items-center justify-center pe-1.5 text-rail-group tabular-nums
                 tracking-table-number text-on-bg-secondary/70
                 stage-wide:min-w-table-period-wide stage-wide:pe-table-period-wide-end
                 stage-wide:text-table-group-wide"
        >{{ row.period }}</span>
        <SiteNeighbourCell
          v-for="neighbour in row.before"
          :key="neighbour.symbol"
          :class="neighbour.group === GROUPS[0] ? NARROW_HIDDEN : ''"
          :symbol="neighbour.symbol"
          :atomic-number="neighbour.number"
        />
        <!-- Intent: the destination key names the section; the name key gives its lowercase chemical element. -->
        <SiteElementCell
          v-departure="row.element.to"
          :to="row.element.to"
          :label="t(row.element.key)"
          :element="row.element.symbol"
          :symbol="row.element.symbol"
          :atomic-number="row.element.number"
          :name="t(row.element.nameKey)"
          :mass="row.element.mass"
          :strike-index="index"
          :tapped="departure?.to === row.element.to"
        />
        <SiteNeighbourCell
          v-for="neighbour in row.after"
          :key="neighbour.symbol"
          :symbol="neighbour.symbol"
          :atomic-number="neighbour.number"
        />
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import type { ObjectDirective } from 'vue'

const { t } = useI18n()
const router = useRouter()
const departure = shallowRef<{ to: string, navigation: ReturnType<typeof router.push> }>()

// Created precedes RouterLink's bubble listener on hydration and mount; capture cancellation still runs first.
const vDeparture: ObjectDirective<HTMLAnchorElement, string> = {
  created(link, { value: to }) {
    link.addEventListener('click', event => navigate(event, to))
  },
}

function navigate(event: MouseEvent, to: string) {
  const link = event.currentTarget as HTMLAnchorElement
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey
    || event.shiftKey || event.altKey || (link.target && link.target !== '_self')
    || link.origin !== location.origin || link.hasAttribute('download')) return
  event.preventDefault()
  const navigation = router.push(to)
  departure.value = { to, navigation }
  // Nuxt captures the old view before this promise completes. Older cancellations cannot clear a retry.
  const clear = () => {
    if (departure.value?.navigation === navigation) departure.value = undefined
  }
  void navigation.then(clear, clear)
}

// The grid's tracks and the cells placed in them both read this list.
const GROUPS = [15, 16, HALOGEN_GROUP, 18]

// A variant and not a bare `hidden` so it outranks the display each cell sets for itself.
const NARROW_HIDDEN = 'max-desk:hidden'

const rows = PERIODS.map(period => ({
  period: period.period,
  element: period.element,
  before: period.neighbours.filter(neighbour => neighbour.group < HALOGEN_GROUP),
  after: period.neighbours.filter(neighbour => neighbour.group > HALOGEN_GROUP),
}))
</script>
