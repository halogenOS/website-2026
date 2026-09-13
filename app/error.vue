<!-- Nuxt replaces the app shell with this page, so it must work independently.
     The home link uses full navigation because app routing may have failed. -->
<template>
  <div class="flex min-h-svh flex-col items-center justify-center gap-5 px-6 text-center">
    <SiteBrandLink
      size="compact"
      tone="night"
    />
    <!-- Intent: error.notFoundBody says this address has no page; error.body attributes other failures to the site. -->
    <p class="max-w-(--measure-prose) text-error-body leading-relaxed text-on-bg">
      {{ t(isMissing ? 'error.notFoundBody' : 'error.body') }}
    </p>
    <!-- Intent: error.home labels the link back to the arrival page. -->
    <a
      href="/"
      class="inline-flex min-h-interaction min-w-interaction items-center rounded-lg text-error-action text-on-bg
             underline decoration-accent decoration-2 underline-offset-4"
    >{{ t('error.home') }}</a>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const { t } = useI18n()

const props = defineProps<{
  error: NuxtError
}>()

const isMissing = computed(() => props.error.statusCode === 404)
</script>
