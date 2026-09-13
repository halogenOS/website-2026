<template>
  <svg
    :viewBox="`0 0 ${SIZE} ${SIZE}`"
    aria-hidden="true"
    focusable="false"
    class="pointer-events-none aspect-square"
  >
    <defs>
      <radialGradient :id="inkFade">
        <stop
          offset="0"
          :stop-color="ink"
        />
        <stop
          offset="0.45"
          :stop-color="ink"
          stop-opacity="0.6"
        />
        <stop
          offset="1"
          :stop-color="ink"
          stop-opacity="0"
        />
      </radialGradient>
      <radialGradient :id="cloudFade">
        <stop
          offset="0"
          :stop-color="cloud"
        />
        <stop
          offset="0.5"
          :stop-color="cloud"
          stop-opacity="0.45"
        />
        <stop
          offset="1"
          :stop-color="cloud"
          stop-opacity="0"
        />
      </radialGradient>
    </defs>
    <circle
      v-for="shell in clouds"
      :key="shell.r"
      :cx="MID"
      :cy="MID"
      :r="shell.r"
      :fill="`url(#${cloudFade})`"
      :opacity="shell.strength"
    />
    <g
      v-for="shell in lobes"
      :key="shell.reach"
      :class="shell.outer ? 'origin-center [transform-box:fill-box] motion-ok:animate-orb-turn-back' : ''"
    >
      <ellipse
        v-for="lobe in shell.axial"
        :key="`${lobe.cx} ${lobe.cy}`"
        :cx="lobe.cx"
        :cy="lobe.cy"
        :rx="lobe.rx"
        :ry="lobe.ry"
        :fill="`url(#${inkFade})`"
        :opacity="lobe.strength"
      />
      <circle
        v-for="cap in shell.capped"
        :key="`${cap.cx} ${cap.cy}`"
        :cx="cap.cx"
        :cy="cap.cy"
        :r="cap.r"
        :fill="`url(#${inkFade})`"
        :opacity="cap.strength"
      />
    </g>
    <circle
      :cx="MID"
      :cy="MID"
      :r="NUCLEUS_HALO"
      :fill="`url(#${inkFade})`"
    />
    <circle
      :cx="MID"
      :cy="MID"
      :r="NUCLEUS"
      :fill="ink"
    />
  </svg>
</template>

<script setup lang="ts">
const SIZE = 200
const MID = 100
const CLOUD_EDGE = 95
const LOBE_REACH = 72
const NUCLEUS_HALO = 16
const NUCLEUS = 5.5
const CLOUD_STRENGTH = 0.95
const CLOUD_FADE = 0.45
const LOBE_FADE = 0.3
const LOBE_INSET = 0.16
const LOBE_WAIST = 0.75
const CAP_REACH = 0.58
const CAP_WAIST = 0.42

const props = defineProps<{
  /** Shells are innermost first, each containing [s, p] electron counts. */
  shells: [number, number][]
  ink: string
  cloud: string
}>()

// Rounded so the server and the client print the same digits.
const round = (value: number) => Number(value.toFixed(2))
const spread = (index: number, count: number) => (count <= 1 ? 1 : index / (count - 1))

const clouds = computed(() => props.shells
  .map(([s], index) => {
    const out = spread(index, props.shells.length)
    return {
      r: round(CLOUD_EDGE * (0.3 + 0.7 * out)),
      strength: round(CLOUD_STRENGTH * (s / 2) * (1 - CLOUD_FADE * out)),
    }
  })
  .filter(shell => shell.strength > 0)
  .reverse())

const lobes = computed(() => {
  const shells = props.shells
  const filled = shells.filter(([, p]) => p > 0).length
  let rank = -1
  return shells.flatMap(([, p], index) => {
    if (p === 0) return []
    rank += 1
    const out = spread(index, shells.length)
    const fade = 1 - LOBE_FADE * spread(rank, filled)
    const reach = LOBE_REACH * (0.42 + 0.58 * out)
    const strength = (pair: number) => round(fade * Math.min(2, Math.max(0, p - 2 * pair)) / 2)
    const inset = LOBE_INSET * reach
    const rx = round((reach - inset) / 2)
    const ry = round(LOBE_WAIST * (reach - inset) / 2)
    const away = round((reach + inset) / 2)
    const capR = round(CAP_WAIST * CAP_REACH * reach)
    const capAway = round((CAP_REACH * reach - CAP_WAIST * CAP_REACH * reach) / Math.SQRT2)
    return [{
      reach: round(reach),
      outer: index === shells.length - 1,
      axial: [
        { cx: round(MID + away), cy: MID, rx, ry, strength: strength(1) },
        { cx: round(MID - away), cy: MID, rx, ry, strength: strength(1) },
        { cx: MID, cy: round(MID + away), rx: ry, ry: rx, strength: strength(2) },
        { cx: MID, cy: round(MID - away), rx: ry, ry: rx, strength: strength(2) },
      ].filter(lobe => lobe.strength > 0),
      capped: [
        { cx: round(MID + capAway), cy: round(MID - capAway), r: capR, strength: strength(0) },
        { cx: round(MID - capAway), cy: round(MID + capAway), r: capR, strength: strength(0) },
      ].filter(cap => cap.strength > 0),
    }]
  })
})

// `useId` so the server's markup and the hydrated markup name the same gradients.
const inkFade = `atom-ink-${useId()}`
const cloudFade = `atom-cloud-${useId()}`
</script>
