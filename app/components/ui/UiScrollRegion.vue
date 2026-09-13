<!-- A part of a page that scrolls inside itself: a named region for landmark navigation,
     focusable so a keyboard can scroll it.

     The optional foot fade begins at a gutter, the lowest box edge near the foot that no
     other box crosses, so the last whole row prints at full ink. A caller asking for the
     fade must let the region reach the bottom edge of what encloses it, or the fade says
     content runs on over empty floor. The fade is on only while a measurement says content
     lies under the foot; the undimmed region is the base. -->
<template>
  <div
    ref="region"
    role="region"
    :aria-labelledby="labelledBy"
    tabindex="0"
    :class="[boundsClass, footFade && cut ? FOOT_FADE : '']"
    :style="{ '--foot-full': footFull, '--foot-faint': footFaint }"
    class="min-h-0 overflow-y-auto overscroll-contain"
  >
    <div
      ref="content"
      :class="innerClass"
      class="pe-3"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
// No defaults for the stop positions: the class is on the element only while the
// measurement that writes both says the region is cut.
const FOOT_FADE = 'desk:[mask-image:linear-gradient(180deg,#000_var(--foot-full),#0001_var(--foot-faint),transparent)]'

// In rem, because the rows they are compared with scale with the root's type size.
const MIN_RUN_REM = 2
const MAX_RUN_REM = 9

// Read per measurement: the root's type size is the reader's to change.
const rootTypeSize = () =>
  Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

// A later knee prints the first cut line's words at a third of their ink, still legible.
const KNEE = 0.2

const props = defineProps<{
  /** The id of the heading naming this region. */
  labelledBy: string
  /** Required so no page inherits another page's height. */
  boundsClass: string
  innerClass?: string
  footFade?: boolean
}>()

const region = useTemplateRef<HTMLElement>('region')
const content = useTemplateRef<HTMLElement>('content')

// A box taller than the window is a container, not a row, and is left out of both the
// candidates and the crossings. Half a pixel of tolerance, because a row's edge and the
// edge of what it holds are one line to the eye and two numbers here.
const gutterAbove = (root: Element, foot: number, run: { min: number, max: number }) => {
  const ceiling = foot - run.max
  const boxes: DOMRect[] = []
  const collect = (element: Element) => {
    const box = element.getBoundingClientRect()
    if (box.bottom < ceiling || box.top > foot) return
    if (box.height <= run.max) boxes.push(box)
    for (const child of element.children) collect(child)
  }
  collect(root)

  const limit = foot - run.min
  let gutter = ceiling
  for (const box of boxes) {
    if (box.bottom <= gutter || box.bottom > limit) continue
    const clear = boxes.every(other => other.top >= box.bottom - 0.5 || other.bottom <= box.bottom + 0.5)
    if (clear) gutter = box.bottom
  }
  return gutter
}

const cut = ref(false)
const footFull = ref<string>()
const footFaint = ref<string>()

// Cheap enough for every scroll event.
const measureCut = () => {
  const element = region.value
  cut.value = element !== null && element.scrollHeight - element.clientHeight - element.scrollTop > 1
}

// The expensive reading, taken only when the fade is wanted and the region is cut.
const measureGutter = () => {
  const element = region.value
  if (element === null || content.value === null || !props.footFade || !cut.value) return
  const rem = rootTypeSize()
  const bounds = { min: MIN_RUN_REM * rem, max: MAX_RUN_REM * rem }
  const foot = element.getBoundingClientRect().bottom
  const run = foot - gutterAbove(content.value, foot, bounds)
  // The stops are shares of the region, not lengths: the gradient measures its own box.
  const stop = (from: number) => `${((1 - from / element.clientHeight) * 100).toFixed(2)}%`
  footFull.value = stop(run)
  footFaint.value = stop(run * (1 - KNEE))
}

// The resize observer fires once on mount, so the first answer needs no event. A scroll
// takes the gutter on a throttle with a trailing call, so a long list is not walked once
// a frame.
const measure = () => {
  measureCut()
  measureGutter()
}
const throttledGutter = useThrottleFn(measureGutter, 100, true)

useResizeObserver([region, content], measure)
useEventListener(region, 'scroll', () => {
  measureCut()
  throttledGutter()
}, { passive: true })
</script>
