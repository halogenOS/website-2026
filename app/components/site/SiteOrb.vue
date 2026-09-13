<template>
  <!-- Paint tokens include alpha; element opacity would apply a second fade. -->
  <svg
    viewBox="0 0 400 400"
    aria-hidden="true"
    focusable="false"
    class="pointer-events-none aspect-square"
  >
    <defs>
      <linearGradient
        v-for="ramp in lines"
        :id="ramp.id"
        :key="ramp.id"
        :x1="ramp.from[0]"
        :y1="ramp.from[1]"
        :x2="ramp.to[0]"
        :y2="ramp.to[1]"
      >
        <stop
          v-for="stop in ramp.stops"
          :key="stop.at"
          :offset="stop.at"
          :stop-color="stop.ink"
        />
      </linearGradient>
      <radialGradient
        v-for="ramp in ramps"
        :id="ramp.id"
        :key="ramp.id"
        cx="50%"
        cy="50%"
        r="50%"
      >
        <stop
          v-for="stop in ramp.stops"
          :key="stop.at"
          :offset="stop.at"
          :stop-color="stop.ink"
        />
      </radialGradient>
      <!-- These coordinates match the source mark's 512-unit space and full triangle height. -->
      <linearGradient
        v-for="ramp in markRamps"
        :id="ramp.id"
        :key="ramp.id"
        gradientUnits="userSpaceOnUse"
        x1="0"
        y1="36"
        x2="0"
        y2="476"
      >
        <stop
          v-for="stop in ramp.stops"
          :key="stop.at"
          :offset="stop.at"
          :stop-color="stop.ink"
        />
      </linearGradient>
    </defs>

    <!-- Placement uses the radius-190 circle as the drawing's outer edge. -->
    <g
      fill="none"
      :stroke="`url(#${hair})`"
      stroke-width="1"
    >
      <circle
        cx="200"
        cy="200"
        r="190"
      />
      <circle
        cx="200"
        cy="200"
        r="111"
      />
    </g>
    <g>
      <circle
        v-for="speck in specks"
        :key="`${speck.x} ${speck.y}`"
        :cx="speck.x"
        :cy="speck.y"
        :r="speck.r"
        :fill="speck.ink"
      />
    </g>
    <g
      class="origin-center [transform-box:fill-box] motion-ok:animate-orb-turn-back"
      fill="none"
      stroke="var(--glow-line-dim)"
      stroke-width="1.75"
      stroke-linecap="round"
    >
      <path
        v-for="tick in ticks"
        :key="tick"
        :d="tick"
      />
    </g>

    <circle
      class="origin-center [transform-box:fill-box] motion-ok:animate-orb-turn"
      cx="200"
      cy="200"
      r="88"
      fill="none"
      :stroke="`url(#${arcA})`"
      stroke-width="3.5"
      stroke-dasharray="154 399"
      stroke-linecap="round"
    />

    <g
      class="motion-ok:animate-orb-pulse"
    >
      <circle
        cx="200"
        cy="200"
        r="86"
        :fill="`url(#${halo})`"
      />
      <circle
        cx="200"
        cy="200"
        r="74"
        :fill="`url(#${backing})`"
      />
    </g>
    <circle
      class="origin-center [transform-box:fill-box] motion-ok:animate-orb-turn"
      cx="200"
      cy="200"
      :r="heavy.radius"
      fill="none"
      :stroke="`url(#${heavyPaint})`"
      stroke-width="5.5"
      :stroke-dasharray="heavy.dasharray"
      :stroke-dashoffset="heavy.dashoffset"
      stroke-linecap="round"
    />
    <g
      transform="translate(200 200) scale(0.2) translate(-256 -256)"
      fill="none"
      stroke-linejoin="round"
      stroke-linecap="round"
    >
      <path
        v-for="wire in markWires"
        :key="wire.d"
        :d="wire.d"
        :stroke-width="wire.width"
        :stroke="wire.paint"
      />
    </g>
    <circle
      class="origin-center [transform-box:fill-box] motion-ok:animate-orb-turn-back"
      cx="200"
      cy="200"
      :r="fine.radius"
      fill="none"
      :stroke="`url(#${finePaint})`"
      stroke-width="2"
      :stroke-dasharray="fine.dasharray"
      :stroke-dashoffset="fine.dashoffset"
    />
  </svg>
</template>

<script setup lang="ts">
import type { Point } from '~/utils/orb'

// Glow tokens stay visible on the blue field in both colour schemes; backdrop fleck tokens darken in light mode.
const specks = [
  { x: 40.5, y: 125.6, r: 2.6, ink: 'var(--glow-line-dim)' },
  { x: 154.2, y: 74.1, r: 3, ink: 'var(--glow-line)' },
  { x: 283.2, y: 125.1, r: 2.2, ink: 'var(--glow-line-dim)' },
  { x: 359.8, y: 141.9, r: 2.2, ink: 'var(--glow-line-cool)' },
  { x: 76.7, y: 226.2, r: 2.8, ink: 'var(--glow-line-dim)' },
  { x: 268.9, y: 329.8, r: 3.2, ink: 'var(--glow-line)' },
  { x: 180.8, y: 383, r: 2.4, ink: 'var(--glow-line-dim)' },
  { x: 96.4, y: 58.3, r: 1.8, ink: 'var(--glow-line-dim)' },
  { x: 341.6, y: 246.7, r: 2.6, ink: 'var(--glow-line-cool)' },
  { x: 47.2, y: 306.4, r: 2.2, ink: 'var(--glow-line-dim)' },
  { x: 215.7, y: 27.9, r: 2, ink: 'var(--glow-line-dim)' },
  { x: 320.4, y: 62.8, r: 1.8, ink: 'var(--glow-line-dim)' },
  { x: 128.6, y: 341.5, r: 2, ink: 'var(--glow-line-dim)' },
]
const ticks = [
  'M200 82v14',
  'M200 304v14',
  'M82 200h14',
  'M304 200h14',
  'M116.6 116.6l9.9 9.9',
  'M283.4 283.4l-9.9-9.9',
  'M283.4 116.6l-9.9 9.9',
  'M116.6 283.4l9.9-9.9',
]

// Gradient references resolve across the document, so each instance needs hydration-stable, unique IDs.
const arcA = `orb-arc-a-${useId()}`
const halo = `orb-halo-${useId()}`
const backing = `orb-backing-${useId()}`
const hair = `orb-hair-${useId()}`
const markInk = `orb-mark-ink-${useId()}`
const markPale = `orb-mark-pale-${useId()}`
const heavyPaint = `orb-spinner-heavy-${useId()}`
const finePaint = `orb-spinner-fine-${useId()}`

const HEAVY_HEAD = 160
const heavy = spinner(76, 159, HEAVY_HEAD)
const fine = spinner(82, 200, HEAVY_HEAD - 180)
const corner: Point = [0, 0]
const spinnerStops = [
  { at: 0, ink: 'var(--spinner-line)' },
  { at: 0.78, ink: 'var(--spinner-line)' },
  { at: 1, ink: 'var(--glow-core)' },
]
const arcStops = [
  { at: 0, ink: 'var(--glow-line-cool)' },
  { at: 0.5, ink: 'var(--glow-line-bright)' },
  { at: 1, ink: 'var(--glow-line)' },
]
const hairStops = [{ at: 0, ink: 'var(--glow-hair)' }, { at: 1, ink: 'var(--glow-hair-far)' }]
const lines = [
  { id: arcA, from: corner, to: [1, 1] as Point, stops: arcStops },
  { id: hair, from: corner, to: [0, 1] as Point, stops: hairStops },
  { id: heavyPaint, from: roundPoint(heavy.from), to: roundPoint(heavy.to), stops: spinnerStops },
  { id: finePaint, from: roundPoint(fine.from), to: roundPoint(fine.to), stops: spinnerStops },
]

// Keep the light outside the mark's reach (radius 49), brightest at 75, and inside the wide arc at 88.
// The backing stays opaque past the mark to radius 52, then fades to avoid a hard disc edge.
const ramps = [
  {
    id: halo,
    stops: [
      { at: 0, ink: 'transparent' },
      { at: 0.7, ink: 'transparent' },
      { at: 0.79, ink: 'var(--glow-2)' },
      { at: 0.87, ink: 'var(--glow-4)' },
      { at: 0.95, ink: 'var(--glow-2)' },
      { at: 1, ink: 'transparent' },
    ],
  },
  {
    id: backing,
    stops: [
      { at: 0, ink: 'var(--mark-backing)' },
      { at: 0.7, ink: 'var(--mark-backing)' },
      { at: 0.86, ink: 'var(--mark-backing-far)' },
      { at: 1, ink: 'transparent' },
    ],
  },
]

const markRamps = [
  { id: markInk, stops: [{ at: 0, ink: 'var(--mark-ink)' }, { at: 1, ink: 'var(--mark-ink-far)' }] },
  { id: markPale, stops: [{ at: 0, ink: 'var(--mark-pale)' }, { at: 1, ink: 'var(--mark-pale-far)' }] },
]

// Paint order and stroke weights must preserve the source mark's front-to-back order and small-size legibility.
const markWires = [
  { d: silhouette(INK_TRIANGLE, MARK_FILLET), width: 16, paint: `url(#${markInk})` },
  { d: silhouette(PALE_TRIANGLE, MARK_FILLET), width: 20, paint: `url(#${markPale})` },
]
</script>
