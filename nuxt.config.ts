import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@vueuse/nuxt',
  ],

  ssr: true,

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      title: 'halogenOS',
      // Pinch zoom is off: the site is a one-viewport composition, and a browser holding
      // a remembered zoom pans the whole page. Accessibility force-zoom still overrides it.
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
        },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  // Server-only settings for the release fetcher. `githubToken` (NUXT_GITHUB_TOKEN) is
  // optional: set, it raises the API rate limit; it must never appear in a tracked file or
  // in the client bundle. `githubApiBase` (NUXT_GITHUB_API_BASE) lets tests point the
  // fetcher at a mock origin or an unreachable port.
  runtimeConfig: {
    githubToken: '',
    githubApiBase: 'https://api.github.com',
  },

  // Page changes run as a browser view transition: named groups (the wordmark) glide
  // between their two places while the stylesheet's transition block shapes the rest.
  // Nuxt skips it under prefers-reduced-motion.
  experimental: {
    viewTransition: true,
  },

  // Raising the compatibility date can change server defaults, so it is explicit.
  compatibilityDate: '2026-08-01',

  // Without an explicit preset Nitro sniffs the build environment, and the output shape
  // the README documents would depend on where the build ran.
  nitro: {
    preset: 'node-server',

    // The cache must outlive a restart. The fs base resolves against the server process
    // working directory at runtime, so a deployment fixes that directory to the output root.
    storage: {
      cache: {
        driver: 'fs',
        base: '.data/cache',
      },
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  // Formatting is enforced by the linter itself; there is no second formatter to keep in
  // sync.
  eslint: {
    config: {
      stylistic: true,
    },
  },

  // English is the only locale today; the prefixless default keeps today's URLs stable
  // if more locales arrive.
  i18n: {
    defaultLocale: 'en',
    strategy: 'prefix_except_default',

    // Browser-language detection is off, and with it the `i18n_redirected` cookie the
    // module otherwise writes on every response. The privacy policy states that this site
    // sets no cookies, and that sentence stays true only while this stays false.
    detectBrowserLanguage: false,

    locales: [
      { code: 'en', language: 'en', file: 'en.json' },
    ],
  },
})
