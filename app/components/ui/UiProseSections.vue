<!-- A document rendered from i18n keys. The default slot stands between a heading and its
     paragraphs and receives the section. Every named slot is handed to each paragraph as
     an interpolation fill, so a message written with {email} prints what the page puts in
     #email. Both slots are offered `linkClass` for the caller's own anchors. -->
<template>
  <section
    v-for="section in sections"
    :key="section.id"
    class="flex flex-col gap-[0.4rem]"
  >
    <h2
      v-if="section.heading"
      class="font-display font-semibold tracking-tight text-on-bg text-[0.95rem]"
    >
      {{ t(section.heading) }}
    </h2>

    <slot
      :section="section"
      :link-class="PROSE_LINK"
    />

    <!-- `keepsLineBreaks` keeps the newlines the keys were written with, for an address
         set as a stack of lines. -->
    <i18n-t
      v-for="key in section.body"
      :key="key"
      :keypath="key"
      tag="p"
      scope="global"
      :class="{ 'whitespace-pre-line': section.keepsLineBreaks }"
      class="text-on-bg text-[0.85rem] leading-relaxed"
    >
      <template
        v-for="name in placeholderSlots"
        #[name]
      >
        <slot
          :name="name"
          :link-class="PROSE_LINK"
        />
      </template>
    </i18n-t>
  </section>
</template>

<script lang="ts">
/** One block of i18n keys. `id` is the stem the keys share, stable across rewrites of the
 *  words. A caller may list sections carrying more than this and gets them back at the
 *  default slot. */
export type ProseSection = {
  id: string
  heading?: string
  body: string[]
  keepsLineBreaks?: boolean
}
</script>

<script setup lang="ts" generic="TSection extends ProseSection">
defineProps<{
  sections: TSection[]
}>()

const { t } = useI18n()
const slots = useSlots()

// `default` must not be forwarded: i18n-t reads every slot as a fill, and the block would
// arrive as the positional {0} when alone and as a fill named `default` beside a named slot.
const placeholderSlots = computed(() => Object.keys(slots).filter(name => name !== 'default'))

const PROSE_LINK = 'underline decoration-1 underline-offset-2'
</script>
