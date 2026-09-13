<template>
  <section
    :class="[paddingClass, measureClass ?? 'max-w-(--measure-content)',
             { 'in-view': gateInView && mounted }]"
    class="mx-auto flex h-full w-full flex-col px-(--stage-pad)
           desk:grid desk:grid-cols-[auto_minmax(0,1fr)] desk:grid-rows-[auto_auto_minmax(0,1fr)]
           desk:gap-x-rail-column"
  >
    <!-- The field clearance also sets the backdrop's edge. -->
    <div class="flex min-h-(--field-clearance) items-start justify-between gap-4 desk:col-span-2">
      <SiteBrandLink size="compact" />
      <SiteMenu
        v-if="place"
        :mark="place.mark"
        :trail="place.trail"
      />
    </div>

    <SiteTrail
      v-if="place"
      :crumbs="place.trail"
      variant="desk"
      data-trail
      class="hidden desk:col-span-2 desk:mt-trail-before desk:mb-trail-after desk:block"
    />

    <SiteRail
      v-if="place"
      :mark="place.mark"
      class="hidden desk:col-start-1 desk:row-start-3 desk:block desk:self-start
             desk:min-h-0 desk:max-h-full desk:overflow-y-auto"
    />

    <div
      :class="[gapClass, alignClass ?? 'justify-center-safe']"
      class="flex min-h-0 flex-1 flex-col desk:col-start-2 desk:row-start-3"
      data-column
    >
      <!-- One heading per route; labelled regions reference this id. -->
      <h1
        id="depth-heading"
        :class="headingClass ?? 'text-depth-heading'"
        class="font-display font-semibold tracking-tight text-on-bg"
      >
        {{ heading }}
      </h1>

      <slot />
      <slot name="tail" />
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** The body-class suffix and namespace of the title key. */
  depth: string
  /** Per-page vertical padding. */
  paddingClass: string
  /** Per-page spacing down the content column. */
  gapClass: string
  /** Invariant heading data, such as a device name, in place of the title key. */
  title?: string
  /** A section page's document title when its heading alone does not identify it. */
  documentTitle?: string
  /** Content measure override. */
  measureClass?: string
  /** Heading type scale override. */
  headingClass?: string
  /** Content alignment only; navigation always starts below the trail. */
  alignClass?: string
  /** Whether the page's arrival animation waits for the in-view mark on mount. */
  gateInView?: boolean
}>()

// A distinct binding name keeps the optional title prop from shadowing the resolved heading.
const { title: heading } = useDepthHead(props.depth, () => props.title, () => props.documentTitle)
const route = useRoute()
const place = computed(() => placeOf(route.path))
const mounted = useMounted()
</script>
