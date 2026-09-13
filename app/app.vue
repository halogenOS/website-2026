<!-- Pages must scroll inside their stage; the shell stays fixed to the viewport. -->
<template>
  <SiteBackdrop />
  <div class="fixed inset-0 grid grid-rows-[minmax(0,1fr)_auto]">
    <main class="relative z-10">
      <NuxtPage />
    </main>
    <SiteFoot class="relative z-10" />
  </div>
</template>

<script setup lang="ts">
import { useMounted } from '@vueuse/core'

const mounted = useMounted()
useHead(() => ({ htmlAttrs: { 'data-mounted': mounted.value ? '' : undefined } }))
</script>
