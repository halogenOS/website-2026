<template>
  <UiIgnitableCell
    :to="to"
    surface="block px-3 pt-[clamp(0.55rem,1.2svh,0.75rem)] pb-[clamp(1.05rem,2svh,1.35rem)]
             desk:px-4 desk:pt-3"
  >
    <div class="relative">
      <span
        class="block text-[0.95rem] font-semibold leading-tight tracking-tight desk:text-[1.05rem]"
      >{{ name }}</span>
      <!-- The codename prints exactly as the build system writes it, case included. -->
      <span
        class="mt-[0.15rem] block font-display leading-none text-[color:var(--element)]
               text-[clamp(1.45rem,5vw,1.9rem)]"
      >{{ codename }}</span>
      <!-- Dates are shown as stored; tabular figures keep the cells aligned down the column. -->
      <dl class="mt-[0.55rem] grid grid-cols-[auto_1fr] gap-x-3 text-[0.7rem] leading-[1.5] tracking-wide">
        <dt class="text-cell-ink-quiet">
          {{ t('devices.lastBuild') }}
        </dt>
        <dd class="tabular-nums">
          {{ lastBuild }}
        </dd>
        <dt class="text-cell-ink-quiet">
          {{ t('devices.buildCount') }}
        </dt>
        <dd class="tabular-nums">
          {{ buildCount }}
        </dd>
      </dl>
    </div>
  </UiIgnitableCell>
</template>

<script setup lang="ts">
// Intent: devices.lastBuild labels the day the newest build for this device was published;
// devices.buildCount labels how many builds it has had in total. Both are short data labels
// in tabular rows.
const { t } = useI18n()

defineProps<{
  /** Where the cell goes: this device's own depth. */
  to: string
  /** The device's marketing name, the way its maker writes it. */
  name: string
  /** The build system's name for the device. */
  codename: string
  /** The day the newest build was published, stored and shown as an ISO date. */
  lastBuild: string
  /** How many builds this device has had. */
  buildCount: number
}>()
</script>
