<!-- Stage variants must stay mutually exclusive so spacing never depends on Tailwind emission order. -->
<template>
  <section
    :class="{ 'in-view': mounted }"
    class="mx-auto flex h-full w-full max-w-(--measure-content) flex-col items-start justify-center-safe
           gap-[clamp(1.4rem,3.4svh,2.6rem)] px-(--stage-pad)
           max-desk:py-[clamp(1.1rem,3svh,4.5rem)]
           desk:grid desk:grid-rows-[auto_minmax(0,1fr)] desk:[--stage-drop:min(var(--stage-pad),7svh)]
           field-corner:[--orb-across:min(calc(28vw-60px),calc(46svh-40px))]
           field-corner:[--orb-centre-x:calc(var(--stage-pad)+var(--orb-across)/2)]
           field-corner:[--orb-centre-y:calc(var(--stage-pad)+var(--orb-across)/2)]
           field-corner:[--edge-in:calc(var(--wedge-edge-across)*1vw)]
           field-corner:[--edge-down:calc(var(--wedge-edge-down)*1lvh)]
           field-floor:[--orb-across:min(30vw,58svh)]
           field-floor:[--orb-centre-x:25vw] field-floor:[--orb-centre-y:46svh]
           field-floor:[--edge-in:calc((var(--wedge-edge-across)-var(--wedge-foot-across))*1vw)]
           field-floor:[--edge-down:calc(var(--wedge-foot-down)*1lvh)]
           stage-wide:max-w-none stage-wide:grid-cols-[minmax(0,1fr)_auto] stage-wide:py-(--stage-drop)
           stage-wide:[--room-rem:min(1rem,2.2223svh)] stage-wide:[--edge-x:calc(var(--wedge-edge-across)*1vw)]
           stage-wide:[--edge-run:tan(atan2(var(--edge-in),var(--edge-down)))]
           stage-wide:[--edge-at-centre:calc(var(--edge-x)-var(--orb-centre-y)*var(--edge-run))]
           stage-wide:[--slot-start:calc(var(--orb-centre-x)+var(--orb-across)/2+1.5rem)]
           stage-wide:[--slot-end:calc(var(--edge-at-centre)-12px*hypot(1,var(--edge-run)))]
           stage-wide:gap-x-[clamp(2rem,6vw,5.5rem)] stage-wide:gap-y-[clamp(1rem,4svh,3.5rem)]
           stage-tall:grid-cols-[minmax(0,1fr)]
           stage-tall:[--orb-across:min(50.5vw,calc(35.4svh-17.2vw-59px))] stage-tall:[--orb-lead:1.95svh]
           stage-tall:pt-(--orb-lead) stage-tall:pb-(--stage-drop)
           stage-tall:gap-[clamp(2rem,6vw,5.5rem)]"
  >
    <!-- Keep `main` as the orb's containing block: this section must not gain positioning,
         transform, filter, perspective or containment that establishes a containing block. -->
    <SiteOrb
      class="absolute -z-10 hidden -translate-x-1/2 -translate-y-1/2 desk:block
             stage-wide:w-(--orb-across) stage-wide:left-(--orb-centre-x) stage-wide:top-(--orb-centre-y)
             stage-tall:w-(--orb-across)
             stage-tall:top-[calc(var(--orb-lead)+var(--orb-across)/2)]
             stage-tall:left-1/2"
    />

    <!-- Measure clearance from visible ink, not boxes: keep 12px from the orb, brand, table,
         floor and field edge. -->
    <SiteAtom
      :shells="[[2, 0], [2, 5]]"
      ink="var(--glow-line)"
      cloud="var(--glow-line-dim)"
      class="absolute -z-10 hidden w-[9vw] -translate-x-1/2 -translate-y-1/2
             field-floor:[display:var(--drawing-on-field)]
             field-floor:top-[82svh] field-floor:left-[12vw]"
    />
    <SiteMolecule
      symbol="Cl"
      ink="var(--glow-line-dim)"
      class="absolute -z-10 hidden w-[8vw] -translate-x-1/2 -translate-y-1/2
             field-floor:block field-floor:top-[20svh] field-floor:left-[44vw]"
    />
    <SiteConstellation
      :points="[[12, 96], [58, 52], [118, 70], [166, 18], [222, 44], [288, 30]]"
      ink="var(--fleck-accent-pale-bright)"
      hair="var(--fleck-neutral-dim)"
      class="absolute -z-10 hidden w-[12.5vw] -translate-x-1/2 -translate-y-1/2
             field-floor:block field-floor:top-[23.2svh] field-floor:left-[76vw]"
    />
    <SiteAtom
      :shells="[[2, 0], [2, 6], [2, 5]]"
      ink="var(--fleck-accent-pale-bright)"
      cloud="var(--fleck-accent-dim)"
      class="absolute -z-10 hidden w-[7vw] -translate-x-1/2 -translate-y-1/2
             field-floor:[display:var(--drawing-in-night)]
             field-floor:top-[76svh] field-floor:left-[60vw]"
    />

    <div
      class="max-w-[26rem] self-start mt-1 desk:row-start-1 stage-wide:mt-0
             stage-wide:brand-over-table:col-start-2 stage-wide:brand-over-table:justify-self-end
             stage-wide:brand-in-field:col-start-1 stage-wide:brand-in-field:row-end-3
             stage-wide:brand-in-field:justify-self-start
             stage-wide:brand-in-field:flex stage-wide:brand-in-field:items-center
             stage-wide:brand-in-field:h-[calc(2*(var(--orb-centre-y)-var(--stage-drop)))]
             stage-wide:brand-in-field:ms-[calc(var(--slot-start)-var(--stage-pad))]
             stage-wide:brand-in-field:[--brand-room:calc(var(--slot-end)-var(--slot-start))]
             stage-wide:brand-in-field:[--brand-slant:var(--edge-run)]
             stage-tall:col-start-1 stage-tall:justify-self-center
             stage-tall:mt-[calc(var(--orb-across)+1.65rem)]"
    >
      <SiteBrandLink
        size="hero"
        tone="arrival"
      />
    </div>

    <SiteElementNav
      class="w-full desk:row-start-2
             stage-wide:col-start-2 stage-wide:w-auto stage-wide:self-center
             stage-tall:col-start-1 stage-tall:self-end"
    />
  </section>
</template>

<script setup lang="ts">
const mounted = useMounted()
</script>
