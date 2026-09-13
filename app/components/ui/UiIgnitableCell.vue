<!-- Shared cell surface; `--element` is read locally for its border, wash and content. -->
<template>
  <component
    :is="to === undefined ? 'div' : NuxtLink"
    :to="to"
    :class="surface"
    :data-lit="lit ? '' : undefined"
    class="group relative overflow-hidden rounded-cell border border-border bg-cell-fill text-on-surface
           ignited:border-[color:var(--element)] motion-ok:transition-colors motion-ok:duration-(--duration-cell)"
  >
    <span
      aria-hidden="true"
      :class="washClass ?? RESTING_WASH"
    />
    <slot />
  </component>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'

const RESTING_WASH = 'bg-cell-wash absolute inset-0 opacity-0 ignited:opacity-100'
  + ' motion-ok:transition-opacity motion-ok:duration-(--duration-cell) in-[[data-lit]]:transition-none'

defineProps<{
  to?: string
  /** Display, padding and sizing classes. The shared class above carries none of those,
   *  so the two never collide; Tailwind would resolve a collision by stylesheet order,
   *  not by position here. */
  surface: string
  washClass?: string
  /** Lit at rest: the border in the element's colour and the wash up before any pointer
   *  arrives. */
  lit?: boolean
}>()
</script>
