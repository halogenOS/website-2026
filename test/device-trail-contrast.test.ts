// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL as FileURL } from 'node:url'
import { runInNewContext } from 'node:vm'
import { compile } from '@tailwindcss/node'
import { compileScript, parse } from '@vue/compiler-sfc'
import { mount } from '@vue/test-utils'
import ts from 'typescript'
import * as vue from 'vue'
import { describe, expect, it } from 'vitest'

// The device trail's shadow is decided in three places that have to agree: the list's
// classes, the theme token the shadow utility writes out, and the depth override that
// colours it on dark desk device pages alone. Each is read from the compiled source.
// Node's own URL: the document environment replaces the global one with a page URL.
const root = fileURLToPath(new FileURL('../', import.meta.url))
const read = (path: string) => readFileSync(`${root}${path}`, 'utf8')

const NuxtLink = vue.defineComponent({
  props: ['to'],
  setup: (props, { slots, attrs }) => () => vue.h('a', { ...attrs, href: props.to }, slots.default?.()),
})

const trail = (variant: 'desk' | 'sheet') => {
  const { descriptor } = parse(read('app/components/site/SiteTrail.vue'))
  const compiled = compileScript(descriptor, { id: 'SiteTrail', inlineTemplate: true })
  const source = ts.transpileModule(compiled.content, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
  const component = runInNewContext(`${source}\nexports.default`, {
    exports: {}, useI18n: () => ({ t: (key: string) => key }), require: (id: string) => {
      if (id !== 'vue') throw new Error(`Unsupported compiled import: ${id}`)
      return vue
    },
  })
  return mount(component, {
    props: { variant, crumbs: [{ to: '/', key: 'nav.home' }, { to: '/devices', key: 'nav.devices' },
      { to: '/devices/pong', text: 'Nothing Phone (2)' }] },
    global: { components: { NuxtLink } },
  })
}

const SHADOW_CLASSES = ['relative', 'w-fit', 'before:absolute', 'before:inset-x-0', 'before:top-1/2',
  'before:-z-10', 'before:h-0', 'before:shadow-trail-backdrop'].map(name => `trail-shadow:${name}`)

// The braces-balanced body of the first block opened by the header, or null when absent.
const blockOf = (css: string, header: string): string | null => {
  const exact = header.replace(/\s*\{$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`(?:^|\\n)\\s*${exact}\\s*\\{`).exec(css)
  if (match === null) return null
  const start = match.index
  let depth = 0
  for (let index = css.indexOf('{', start); index < css.length; index += 1) {
    if (css[index] === '{') depth += 1
    if (css[index] === '}' && (depth -= 1) === 0) return css.slice(start, index + 1)
  }
  return null
}

describe('the device trail shadow', () => {
  it('stands on the desk list alone, sized to its crumbs', () => {
    const desk = trail('desk')
    const sheet = trail('sheet')
    try {
      const deskClasses = desk.get('ol').classes()
      for (const name of SHADOW_CLASSES) expect(deskClasses).toContain(name)
      expect(desk.get('nav').classes()).toEqual(['trail-shadow:relative', 'trail-shadow:isolate'])
      expect(deskClasses.filter(name => /^(relative|w-fit|isolate|before:)/.test(name))).toEqual([])
      expect(sheet.get('nav').classes()).toEqual([])
      expect(sheet.get('ol').classes().filter(name => name.startsWith('trail-shadow:'))).toEqual([])
      expect(desk.findAll('li')).toHaveLength(3)
      expect(desk.get('[aria-current="page"]').text()).toBe('Nothing Phone (2)')
    }
    finally {
      desk.unmount()
      sheet.unmount()
    }
  })

  it('compiles the accepted shadow token and its dark desk device colour from the actual stylesheet', async () => {
    const wrapper = trail('desk')
    const candidates = wrapper.html().replace(/["'`<>]/g, ' ').split(/\s+/)
    wrapper.unmount()
    const compiler = await compile(read('app/assets/css/main.css'), {
      base: `${root}app/assets/css`, onDependency: () => {},
    })
    const css = compiler.build(candidates)

    const scoped = blockOf(css, '@media (width >= 761px) and (prefers-color-scheme: dark)') ?? ''
    const rule = (name: string) => {
      const selector = `.trail-shadow\\:${name.replaceAll(':', '\\:').replaceAll('/', '\\/')}`
        + ':where(body.depth.depth-device *)' + (name.startsWith('before:') ? '::before' : '')
      return blockOf(scoped, selector)
    }
    const shadow = rule('before:shadow-trail-backdrop')
    expect(shadow).toContain('content: var(--tw-content)')
    expect(shadow).toContain('--tw-shadow: 0 0 2.25rem 1.25rem var(--tw-shadow-color, var(--trail-backdrop))')
    expect(shadow).toMatch(/box-shadow: .*var\(--tw-shadow\)/)
    // The shadow is written into the rule: a root declaration would resolve its colour where it is unset.
    expect(css).not.toContain('--shadow-trail-backdrop:')
    expect(rule('relative')).toContain('position: relative')
    expect(rule('isolate')).toContain('isolation: isolate')
    expect(rule('w-fit')).toContain('width: fit-content')
    expect(rule('before:absolute')).toContain('position: absolute')
    expect(rule('before:-z-10')).toContain('z-index: calc(10 * -1)')
    expect(rule('before:h-0')).toMatch(/height: (0|calc\(var\(--spacing\) \* 0\))/)
    expect(rule('before:top-1/2')).toContain('top: calc(1 / 2 * 100%)')
    expect(rule('before:inset-x-0')).toContain('inset-inline: ')
    expect(css.replace(scoped, '')).not.toContain('.trail-shadow\\:')

    expect(blockOf(css, 'body.depth {')).toContain('--trail-backdrop: transparent')
    const colour = 'color-mix(in oklab, var(--color-bg) 75%, transparent)'
    expect(css.split(`--trail-backdrop: ${colour}`)).toHaveLength(2)
    const dark = blockOf(css, '@media (width > 760px) and (prefers-color-scheme: dark)')
    expect(blockOf(dark ?? '', 'body.depth.depth-device')).toContain(`--trail-backdrop: ${colour}`)
    expect(blockOf((dark ?? '').replaceAll('body.depth.depth-device', 'body.depth.depth-device.never'),
      'body.depth.depth-device')).toBeNull()
    expect(css.replace(dark ?? '', '')).not.toContain(colour)
  })
})
