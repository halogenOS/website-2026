<template>
  <footer class="relative min-h-8 bg-glow-foot">
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 h-px bg-shelf-edge"
    />

    <!-- The row's leading is the font's, not the document's 1.5, so the foot is one line tall. -->
    <div
      class="mx-auto grid max-w-(--measure-content) grid-cols-[1fr_auto] items-center
             gap-x-[clamp(1.2rem,3vw,2.6rem)] px-[clamp(1.25rem,4.5vw,4.5rem)]
             py-[clamp(0.55rem,1.1svh,0.8rem)] leading-[normal]"
    >
      <!-- Intent: foot.copyright is the site's copyright line, printed on every page. Its
           `{name}` placeholder is where the project's name stands, set in the display face while
           the rest is fine print, so each locale can place the name by its own grammar. -->
      <i18n-t
        keypath="foot.copyright"
        tag="p"
        class="justify-self-start whitespace-nowrap text-on-bg-secondary
               text-[0.78rem] desk:text-[0.82rem]"
      >
        <template #name>
          <span
            class="font-display font-medium tracking-[-0.01em] text-on-bg text-[0.84rem] desk:text-[0.9rem]"
          >{{ t('brand.name') }}</span>
        </template>
      </i18n-t>

      <!-- Intent: foot.privacy labels the link to the privacy policy and foot.imprint the link
           to the legal notice, each with the words a reader scans a footer for. -->
      <div class="flex items-center justify-self-end gap-[clamp(0.75rem,2vw,1.4rem)]">
        <NuxtLink
          to="/privacy"
          :class="FOOT_LINK"
        >{{ t('foot.privacy') }}</NuxtLink>
        <NuxtLink
          to="/imprint"
          :class="FOOT_LINK"
        >{{ t('foot.imprint') }}</NuxtLink>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { t } = useI18n()

// Keyboard focus is the site-wide ring; no focus style here.
const FOOT_LINK = `relative whitespace-nowrap rounded-xs text-on-bg-secondary
  text-[0.74rem] no-underline hover:text-on-bg desk:text-[0.78rem]
  after:absolute after:inset-x-0 after:-bottom-[0.3em] after:h-px after:origin-left
  after:scale-x-0 after:bg-shelf-baseline
  hover:after:scale-x-100
  motion-safe:transition-colors motion-safe:duration-[180ms]
  motion-safe:after:transition-transform motion-safe:after:duration-[220ms]`
</script>
