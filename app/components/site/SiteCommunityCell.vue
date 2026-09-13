<template>
  <UiIgnitableCell
    :to="to"
    target="_blank"
    rel="noopener noreferrer"
    surface="flex h-full flex-col p-community-cell desk:min-h-60"
    wash-class="room-wash pointer-events-none absolute inset-0 opacity-70 ignited:opacity-100
                motion-safe:transition-opacity motion-safe:duration-(--duration-cell)"
  >
    <span
      v-if="motif === 'chat'"
      aria-hidden="true"
      class="pointer-events-none absolute -right-9 -bottom-8 h-community-motif w-(--container-community-motif)
               -rotate-5
             motion-ok:animate-sway"
    >
      <span
        class="border-community-outline-near absolute top-community-bubble-top left-0 h-community-bubble-near
               w-(--container-community-bubble-near) rounded-community-bubble-near
               rounded-bl-community-tail border-2"
      />
      <span
        class="border-community-outline-far absolute top-3 left-24 h-community-bubble-far w-24
               rounded-community-bubble-far
               rounded-br-community-tail border-2"
      />
      <span class="room-voices absolute top-20 left-community-voices h-2 w-10" />
    </span>
    <span
      v-else
      aria-hidden="true"
      class="room-ripples pointer-events-none absolute inset-0 motion-ok:animate-sway-slow"
    />
    <div class="relative flex flex-1 flex-col">
      <h2
        class="font-display text-community-name leading-community-name font-semibold tracking-tight"
      >
        {{ name }}
      </h2>
      <p
        class="mt-community-description max-w-(--container-community-description) text-community-description
               leading-community-description text-cell-ink-quiet"
      >
        {{ line }}
      </p>
      <div
        v-if="motif === 'chat'"
        aria-hidden="true"
        class="mt-community-texture flex items-center gap-community-texture-gap"
      >
        <span class="flex">
          <span class="bg-voice-disc-blue size-8 rounded-full border-2 border-surface" />
          <span class="bg-voice-disc-cyan -ml-community-overlap size-8 rounded-full border-2 border-surface" />
          <span class="bg-voice-disc-green -ml-community-overlap size-8 rounded-full border-2 border-surface" />
          <span class="bg-voice-disc-violet -ml-community-overlap size-8 rounded-full border-2 border-surface" />
        </span>
        <span class="grid w-full max-w-community-chat flex-1 gap-community-conversation">
          <span class="bg-community-texture-lit h-1.5 w-community-line-86 rounded-full" />
          <span class="bg-on-surface/14 h-1.5 w-community-line-58 rounded-full" />
        </span>
      </div>
      <div
        v-else
        aria-hidden="true"
        class="mt-community-texture grid max-w-(--container-community-feed) gap-community-overlap ps-community-feed"
      >
        <span class="flex items-center gap-2">
          <span class="bg-community-dot -ms-community-feed size-1.25 flex-none rounded-full" />
          <span class="bg-on-surface/22 h-1.5 w-community-line-88 rounded-full" />
        </span>
        <span class="flex items-center gap-2">
          <span class="bg-community-dot -ms-community-feed size-1.25 flex-none rounded-full" />
          <span class="bg-on-surface/14 h-1.5 w-community-line-70 rounded-full" />
        </span>
        <span class="flex items-center gap-2">
          <span class="bg-community-dot -ms-community-feed size-1.25 flex-none rounded-full" />
          <span class="bg-on-surface/14 h-1.5 w-community-line-52 rounded-full" />
        </span>
        <span class="flex items-center gap-2">
          <span class="bg-community-dot -ms-community-feed size-1.25 flex-none rounded-full" />
          <span class="bg-on-surface/14 h-1.5 w-community-line-36 rounded-full" />
        </span>
      </div>
      <div class="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-community-floor">
        <span
          class="bg-telegram-pill inline-flex items-center gap-2 rounded-full px-4 py-2
                 font-display text-service-label font-semibold text-[color:var(--telegram-ink)]"
        >
          <Send
            aria-hidden="true"
            class="size-community-plane"
          />
          {{ service }}
        </span>
        <span class="font-display text-community-address font-medium tracking-community-address text-cell-ink-quiet">
          {{ address }}
        </span>
      </div>
    </div>
  </UiIgnitableCell>
</template>

<script setup lang="ts">
import { Send } from 'lucide-vue-next'

const props = defineProps<{
  to: string
  name: string
  line: string
  service: string
  motif: 'chat' | 'news'
}>()

const address = computed(() => props.to.replace(/^https?:\/\//, ''))
</script>
