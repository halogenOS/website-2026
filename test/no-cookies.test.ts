import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// `privacy.cookiesBody` states that the site sets no cookies, a legal statement under
// Article 13 GDPR and § 25 TDDDG. One setting keeps it true: `@nuxtjs/i18n` writes an
// `i18n_redirected` cookie on every response, 404s included, unless
// `detectBrowserLanguage` is false. The sentence and the setting are checked against
// each other so neither can move without the other.

const readSource = (path: string): string => readFileSync(join(process.cwd(), path), 'utf8')

describe('the no-cookies claim', () => {
  it('is backed by browser-language detection being off', () => {
    const config = readSource('nuxt.config.ts')
    expect(config, 'nuxt.config.ts no longer turns detectBrowserLanguage off')
      .toMatch(/^\s*detectBrowserLanguage:\s*false/m)
  })

  it('is the claim the policy actually publishes', () => {
    const copy = JSON.parse(readSource('i18n/locales/en.json')) as { privacy: { cookiesBody: string } }
    expect(copy.privacy.cookiesBody, 'the policy no longer claims this site sets no cookies')
      .toContain('This site sets no cookies')
  })
})
