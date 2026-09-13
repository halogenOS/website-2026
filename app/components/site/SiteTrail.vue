<template>
  <!-- Intent: trail.label identifies the breadcrumb landmark, distinct from global navigation. -->
  <nav
    :aria-label="t('trail.label')"
    :class="variant === 'desk' ? 'trail-shadow:relative trail-shadow:isolate' : ''"
  >
    <ol
      :class="LIST[variant]"
      class="flex flex-wrap items-center gap-x-2 font-display font-medium tracking-navigation"
    >
      <li
        v-for="(crumb, index) in crumbs"
        :key="crumb.to"
        class="inline-flex items-center gap-2"
      >
        <span
          v-if="index > 0"
          aria-hidden="true"
          class="text-trail-separator leading-none"
        >›</span>
        <!-- Intent: the dynamic crumb names this level, using the page title or invariant device name. -->
        <span
          v-if="index === crumbs.length - 1"
          aria-current="page"
          class="inline-flex min-h-interaction items-center font-semibold text-(--crumb-current)"
        >{{ words(crumb) }}</span>
        <!-- Intent: each parent destination uses the same name as its own page. -->
        <NuxtLink
          v-else
          :to="crumb.to"
          class="inline-flex min-h-interaction min-w-interaction items-center rounded-sm
                 underline-offset-4 decoration-2 hover:text-(--crumb-current)
                 decoration-[color:var(--element,var(--color-on-surface-secondary))] hover:underline
                 motion-safe:transition-colors motion-safe:duration-(--duration-trail)"
        >{{ words(crumb) }}</NuxtLink>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import type { Crumb } from '~/utils/places'

const { t } = useI18n()

const LIST = {
  desk: `text-trail text-(--trail-ink) [--crumb-current:var(--trail-ink-current)]
         trail-shadow:relative trail-shadow:w-fit trail-shadow:before:absolute
         trail-shadow:before:inset-x-0 trail-shadow:before:top-1/2 trail-shadow:before:-z-10
         trail-shadow:before:h-0 trail-shadow:before:shadow-trail-backdrop`,
  sheet: 'text-trail-sheet text-on-surface-secondary [--crumb-current:var(--color-on-surface)]',
} as const

// Intent: resolve a level's page-name key; invariant device names are not translated.
const words = (crumb: Crumb): string => ('key' in crumb ? t(crumb.key) : crumb.text)

defineProps<{
  crumbs: readonly Crumb[]
  variant: keyof typeof LIST
}>()
</script>
