<template>
  <UiIgnitableCell
    surface="h-full px-3 py-[clamp(0.6rem,1.4svh,0.85rem)]
             desk:px-4 desk:py-3.5"
    :style="{ '--element': `var(${paint})` }"
  >
    <div class="relative">
      <!-- The mark repeats the heading, so it is decorative: empty alt, never announced twice. -->
      <div class="flex items-center gap-3.5">
        <img
          :src="mark"
          alt=""
          class="h-[clamp(3rem,5.5vw,3.75rem)] w-auto flex-none"
        >
        <!-- A heading, so a reader moving by headings reaches every cell. -->
        <h2
          class="text-[0.95rem] font-semibold leading-tight tracking-tight desk:text-[1.05rem]"
        >
          {{ name }}
        </h2>
      </div>
      <div
        aria-hidden="true"
        class="bg-rule-ramp h-(--hairline) mt-[0.9rem]"
      />
      <p class="mt-[0.8rem] text-[0.78rem] leading-[1.5] text-cell-ink-quiet">
        {{ claim }}
      </p>
    </div>
  </UiIgnitableCell>
</template>

<script setup lang="ts">
defineProps<{
  /** The feature's mark. */
  mark: string
  /** The custom property holding the feature's colour, read here as `--element`. */
  paint: string
  /** The feature's name, standing as the cell's heading. */
  name: string
  /** What the project claims about it, one or two sentences. */
  claim: string
}>()
</script>
