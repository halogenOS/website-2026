<template>
  <!-- Firefox counts oversized fixed boxes as scrollable overflow, so the outer box must clip.
       The inner box uses large-viewport height to avoid repainting when browser chrome moves. -->
  <div
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 z-0 overflow-hidden [view-transition-name:world]"
  >
    <div class="absolute inset-x-0 top-0 h-lvh">
      <div class="backdrop-night absolute inset-0" />
      <div
        class="absolute inset-0 [clip-path:polygon(var(--wedge-line-shape))] bg-(--wedge-outline)
               motion-ok:transition-[clip-path] motion-ok:duration-(--duration-field) motion-ok:ease-out"
      />
      <div
        class="backdrop-wedge absolute inset-0 [clip-path:polygon(var(--wedge-shape))]
               from-(color:--wedge-deep)
               via-(color:--wedge-core) to-(color:--wedge-bright)
               motion-ok:transition-[clip-path,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to]
               motion-ok:duration-(--duration-field) motion-ok:ease-out"
      />
      <div
        class="backdrop-far absolute inset-0
               [--drift-tile:var(--spacing-fleck-far)] motion-ok:animate-drift-far"
      />
      <div
        class="backdrop-near absolute inset-0
               [--drift-tile:var(--spacing-fleck-near)] motion-ok:animate-drift-near"
      />
      <div
        class="backdrop-spore absolute inset-0
               [--drift-tile:var(--spacing-fleck-spore)] motion-ok:animate-drift-spore"
      />
    </div>
  </div>
</template>
