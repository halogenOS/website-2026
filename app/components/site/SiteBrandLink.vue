<template>
  <NuxtLink
    to="/"
    :class="[SIZE[size].root, TONE[tone]]"
    class="[view-transition-name:brand] flex w-fit rounded-lg py-(--brand-pad) [--brand-pad:0.375rem]
           [--compact-mark:clamp(32px,4.4vw,42px)] [--compact-word:clamp(1.05rem,2.6vw,1.4rem)]
           [--compact-gap:0.7rem]"
  >
    <!-- Empty alt avoids repeating the adjacent link name. -->
    <img
      src="/logo.png"
      alt=""
      width="512"
      height="349"
      :class="SIZE[size].mark"
      class="block h-auto"
    >
    <!-- Intent: brand.name is the project's own name, never translated. -->
    <span
      :class="SIZE[size].word"
      class="font-display font-light leading-none tracking-tight"
    >{{ t('brand.name') }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
const { t } = useI18n()

// Stage variants must be exclusive: Tailwind orders competing utilities, not their position in the class string.
const SIZE = {
  hero: {
    // In the --brand-rem fit, 14.93 is the name's width in scale units at this letter-spacing.
    // The 1.55 constant is half its height in the same units.
    root: `max-desk:items-center max-desk:gap-[1.1rem]
           stage-wide:items-center stage-wide:gap-[max(var(--compact-gap),1.1*var(--brand-rem,1rem))]
           stage-wide:brand-over-table:[--brand-rem:var(--room-rem,1rem)]
           stage-wide:brand-in-field:[--brand-recess:calc(var(--brand-pad)*var(--brand-slant))]
           stage-wide:brand-in-field:[--brand-fit:calc(var(--brand-room)-var(--brand-recess))]
           stage-wide:brand-in-field:[--brand-per-unit:calc(14.93+1.55*var(--brand-slant))]
           stage-wide:brand-in-field:[--brand-rem:min(var(--room-rem,1rem),var(--brand-fit)/var(--brand-per-unit))]`,
    mark: `max-desk:w-[clamp(56px,9vw,96px)]
           stage-wide:w-[clamp(var(--compact-mark),min(9vw,6*var(--brand-rem,1rem)),96px)]
           stage-wide:brand-in-field:hidden stage-tall:hidden`,
    word: `max-desk:text-[clamp(1.85rem,4.6vw,3.1rem)]
           stage-wide:text-[length:clamp(var(--compact-word),min(4.6vw,3.1*var(--brand-rem,1rem)),3.1rem)]
           stage-tall:text-[clamp(2.3rem,6.6vw,4.6rem)]`,
  },
  compact: {
    // The compact mark alone is shorter than the 44px minimum hit target.
    root: 'items-center gap-(--compact-gap) min-h-11',
    mark: 'w-(--compact-mark)',
    word: 'text-(length:--compact-word)',
  },
} as const

const TONE = {
  field: 'text-wedge-ink',
  night: 'text-on-bg',
  arrival: `max-desk:text-wedge-ink stage-tall:text-wedge-ink
            stage-wide:brand-over-table:text-on-bg stage-wide:brand-in-field:text-wedge-ink`,
} as const

withDefaults(defineProps<{
  size?: keyof typeof SIZE
  tone?: keyof typeof TONE
}>(), { size: 'hero', tone: 'field' })
</script>
