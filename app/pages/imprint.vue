<!-- The legal notice. The shell is fixed to the viewport, so the prose scrolls inside
     one region below the heading. -->
<template>
  <SiteDepthPage
    depth="imprint"
    padding-class="py-depth"
    gap-class="gap-legal-heading"
  >
    <!-- Intent: imprint.title is the page's h1 and its document title, both printed by
         the shell from the depth named above; it names the document by the term German
         law uses for it. -->
    <UiScrollRegion
      labelled-by="depth-heading"
      bounds-class="flex-1"
      inner-class="flex max-w-(--measure-prose) flex-col gap-prose-section pb-1"
    >
      <UiProseSections :sections="SECTIONS">
        <!-- The table's aria-label repeats the section heading so a reader arriving by
             table navigation hears what the table is; the heading is not printed inside it.

             Intent: imprint.contactPurpose heads the column saying what a reader is
             writing about; imprint.contactAddress heads the column holding where to
             write. imprint.contactLegal names everything general and legal;
             imprint.contactPrivacy names data protection; imprint.contactAbuse names a
             report of unlawful content. -->
        <template #default="{ section, linkClass }">
          <table
            v-if="section.contacts"
            :aria-label="t('imprint.contactHeading')"
            class="w-full border-collapse text-start text-on-bg text-contact-table leading-relaxed"
          >
            <thead>
              <tr>
                <th
                  scope="col"
                  class="border-b border-border py-contact-row pe-4 font-medium text-on-bg-secondary"
                >
                  {{ t('imprint.contactPurpose') }}
                </th>
                <th
                  scope="col"
                  class="border-b border-border py-contact-row font-medium text-on-bg-secondary"
                >
                  {{ t('imprint.contactAddress') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="contact in section.contacts"
                :key="contact.email"
              >
                <th
                  scope="row"
                  class="py-contact-row pe-4 text-start align-top font-normal"
                >
                  {{ t(contact.purpose) }}
                </th>
                <td class="py-contact-row align-top">
                  <a
                    :href="`mailto:${contact.email}`"
                    :class="linkClass"
                  >{{ contact.email }}</a>
                </td>
              </tr>
            </tbody>
          </table>
        </template>

        <!-- The keys carrying {email} fill their slot here with a working link. -->
        <template #email="{ linkClass }">
          <a
            :href="`mailto:${ABUSE_EMAIL}`"
            :class="linkClass"
          >{{ ABUSE_EMAIL }}</a>
        </template>
      </UiProseSections>
    </UiScrollRegion>
  </SiteDepthPage>
</template>

<script setup lang="ts">
import type { ProseSection } from '~/components/ui/UiProseSections.vue'

const { t } = useI18n()

/** One purpose and the address it is written to. */
type Contact = { purpose: string, email: string }

/** A block of the notice, plus the rows the contact section prints. */
type Section = ProseSection & { contacts?: Contact[] }

const CONTACTS: Contact[] = [
  { purpose: 'imprint.contactLegal', email: LEGAL_EMAIL },
  { purpose: 'imprint.contactPrivacy', email: PRIVACY_EMAIL },
  { purpose: 'imprint.contactAbuse', email: ABUSE_EMAIL },
]

// Only the operator block keeps its line breaks: an address is a stack of lines.
//
// Intent. A locale carries the legal meaning each block establishes, never the English
// wording. The operator's name and postal address and the cited provisions are the
// disclosures German law requires and stay invariant in every locale:
//   imprint.intro states which provision of German digital services law requires this
//   page to exist.
//   imprint.operatorHeading names the block identifying who operates the site;
//   imprint.operatorBody is that identity and its postal address, never rewritten or
//   reflowed.
//   imprint.contactHeading names the block holding the addresses to write to, and names
//   the table under it to a reader who meets the table on its own.
//   imprint.contactNote states that there is no telephone line, that email is the
//   channel, and which languages are answered.
//   imprint.aboutHeading names the block describing the service;
//   imprint.about describes this website, what it presents, that its download links
//   point at published release files held elsewhere, and that it is private and
//   non-commercial, with no advertising, no fee and no sale of data.
//   imprint.reportingHeading names the block on reporting content;
//   imprint.reportingBody says where to report unlawful or infringing content, what a
//   report must carry, and that a person checks it and acts where justified.
//   imprint.disputeHeading names the consumer dispute question;
//   imprint.disputeBody declines participation in consumer arbitration and names the
//   provision that asks.
//   imprint.liabilityHeading names the block on liability for content and for links;
//   imprint.liabilityContent establishes that everything here is the project's own
//   content and that the operator answers for it under the general law.
//   imprint.liabilityReports says the content comes from an open-source project of many
//   contributors over many years and repeats where an infringement is reported and what
//   follows; imprint.liabilityLinks states that linked sites are outside the operator's
//   control, that nothing was apparent when the link was made, that permanent monitoring
//   is unreasonable without concrete evidence, and that such links are removed on notice.
//   imprint.updated dates the notice on this site.
const SECTIONS: Section[] = [
  { id: 'intro', body: ['imprint.intro'] },
  {
    id: 'operator',
    heading: 'imprint.operatorHeading',
    body: ['imprint.operatorBody'],
    keepsLineBreaks: true,
  },
  {
    id: 'contact',
    heading: 'imprint.contactHeading',
    contacts: CONTACTS,
    body: ['imprint.contactNote'],
  },
  { id: 'about', heading: 'imprint.aboutHeading', body: ['imprint.about'] },
  { id: 'reporting', heading: 'imprint.reportingHeading', body: ['imprint.reportingBody'] },
  { id: 'dispute', heading: 'imprint.disputeHeading', body: ['imprint.disputeBody'] },
  {
    id: 'liability',
    heading: 'imprint.liabilityHeading',
    body: ['imprint.liabilityContent', 'imprint.liabilityReports', 'imprint.liabilityLinks'],
  },
  { id: 'updated', body: ['imprint.updated'] },
]
</script>
