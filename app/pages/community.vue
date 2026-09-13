<template>
  <SiteDepthPage
    depth="community"
    padding-class="py-[clamp(0.85rem,2.2svh,2.2rem)]"
    gap-class="gap-[clamp(0.55rem,1.5svh,1.1rem)]"
  >
    <!-- Intent: community.title invites readers to join the community; the shell uses it for the h1 and tab title. -->
    <ul class="grid gap-[clamp(0.5rem,1.1svh,0.75rem)] desk:grid-cols-2">
      <li
        v-for="place in PLACES"
        :key="place.to"
      >
        <SiteCommunityCell
          :to="place.to"
          :name="t(place.name)"
          :line="t(place.line)"
          :service="t(place.service)"
          :motif="place.motif"
        />
      </li>
    </ul>
  </SiteDepthPage>
</template>

<script setup lang="ts">
const { t } = useI18n()

// Intent: community.chatName names the main discussion group; community.chatLine explains that people talk there.
// Intent: community.newsName names the announcements channel; community.newsLine explains that announcements
// appear there.
// Intent: community.telegram names the service on each link button.
const PLACES = [
  {
    to: 'https://t.me/halogenOS',
    name: 'community.chatName',
    line: 'community.chatLine',
    service: 'community.telegram',
    motif: 'chat',
  },
  {
    to: 'https://t.me/xos_news',
    name: 'community.newsName',
    line: 'community.newsLine',
    service: 'community.telegram',
    motif: 'news',
  },
] as const
</script>
