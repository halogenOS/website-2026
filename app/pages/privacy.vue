<template>
  <SiteDepthPage
    depth="privacy"
    padding-class="py-depth"
    gap-class="gap-legal-heading"
  >
    <!-- Intent: privacy.title names the privacy policy in the page heading and document title. -->
    <UiScrollRegion
      labelled-by="depth-heading"
      bounds-class="flex-1"
      inner-class="flex max-w-(--measure-prose) flex-col gap-prose-section pb-1"
    >
      <UiProseSections :sections="SECTIONS">
        <template #email="{ linkClass }">
          <a
            :href="`mailto:${PRIVACY_EMAIL}`"
            :class="linkClass"
          >{{ PRIVACY_EMAIL }}</a>
        </template>
        <template #url="{ linkClass }">
          <a
            :href="AUTHORITY_URL"
            target="_blank"
            rel="noopener noreferrer"
            :class="linkClass"
          >{{ AUTHORITY_URL }}</a>
        </template>
      </UiProseSections>
    </UiScrollRegion>
  </SiteDepthPage>
</template>

<script setup lang="ts">
import type { ProseSection } from '~/components/ui/UiProseSections.vue'

const AUTHORITY_URL = 'https://www.lda.bayern.de'

// Intent: privacy.intro identifies this website's privacy notice under Article 13 GDPR.
// Intent: privacy.controllerHeading labels the controller's identity and address.
// Intent: privacy.controllerBody identifies the controller; preserve the name, postal address and line breaks.
// Intent: privacy.controllerNote gives the enquiry contact and officer exemption; preserve {email} and § 38 BDSG.
// Intent: privacy.logsHeading identifies server logs as the personal data processed.
// Intent: privacy.logsBody explains recorded request fields, local use without profiling or combining,
// and the absence of forms or any obligation to provide data.
// Intent: privacy.logsPurpose states why server logs are needed.
// Intent: privacy.logsBasis states the legal basis; preserve the article number and legitimate interest.
// Intent: privacy.releaseHeading introduces access to release data.
// Intent: privacy.releaseBody discloses server-side release metadata requests without visitor data,
// no browser contact with GitHub while reading, and GitHub storage access when following download links.
// Intent: privacy.cookiesHeading introduces cookie use.
// Intent: privacy.cookiesBody explains the absence of cookies, device storage, sessions, forms and analytics,
// why no consent banner is required under § 25 TDDDG, and that earlier cookies are neither set nor read.
// Intent: privacy.notdoHeading introduces excluded processing activities.
// Intent: privacy.notdoBody excludes advertising, third-party assets, data sales, automated decisions,
// email, accounts and forms; preserve Article 22 GDPR.
// Intent: privacy.processorsHeading identifies who processes data for the site.
// Intent: privacy.processorsBody names Hetzner Online GmbH under Article 28 GDPR and hosting in Germany;
// preserve those facts and the absence of transfers outside the EU/EEA.
// Intent: privacy.retentionHeading introduces storage duration.
// Intent: privacy.retentionBody explains log rotation, statutory retention and the absence of submitted content.
// Intent: privacy.rightsHeading introduces data protection rights.
// Intent: privacy.rightsBody lists the rights and their legal bases; preserve every article number.
// Intent: privacy.rightsContact gives the address for exercising those rights; preserve {email}.
// Intent: privacy.complaintHeading introduces the right to complain.
// Intent: privacy.complaintBody identifies where complaints may be lodged; preserve the competent authority's
// name, postal address and {url}.
// Intent: privacy.changesHeading introduces policy updates.
// Intent: privacy.changesBody explains that the policy may change and this address holds the current version.
// Intent: privacy.updated dates this policy version; preserve the date.
const SECTIONS: ProseSection[] = [
  { id: 'intro', body: ['privacy.intro'] },
  {
    id: 'controller',
    heading: 'privacy.controllerHeading',
    body: ['privacy.controllerBody', 'privacy.controllerNote'],
    keepsLineBreaks: true,
  },
  {
    id: 'logs',
    heading: 'privacy.logsHeading',
    body: ['privacy.logsBody', 'privacy.logsPurpose', 'privacy.logsBasis'],
  },
  { id: 'release', heading: 'privacy.releaseHeading', body: ['privacy.releaseBody'] },
  { id: 'cookies', heading: 'privacy.cookiesHeading', body: ['privacy.cookiesBody'] },
  { id: 'notdo', heading: 'privacy.notdoHeading', body: ['privacy.notdoBody'] },
  { id: 'processors', heading: 'privacy.processorsHeading', body: ['privacy.processorsBody'] },
  { id: 'retention', heading: 'privacy.retentionHeading', body: ['privacy.retentionBody'] },
  {
    id: 'rights',
    heading: 'privacy.rightsHeading',
    body: ['privacy.rightsBody', 'privacy.rightsContact'],
  },
  { id: 'complaint', heading: 'privacy.complaintHeading', body: ['privacy.complaintBody'] },
  { id: 'changes', heading: 'privacy.changesHeading', body: ['privacy.changesBody'] },
  { id: 'updated', body: ['privacy.updated'] },
]
</script>
