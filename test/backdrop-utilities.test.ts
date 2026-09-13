import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { compile } from '@tailwindcss/node'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

describe('native backdrop colour stops', () => {
  it('emits single-gradient tokens and geometry from their actual consumers', async () => {
    const names = ['SiteFoot', 'SiteCommunityCell', 'SiteFeatureCell', 'SiteBackdrop']
    const components = await Promise.all(names.map(name => read(`app/components/site/${name}.vue`)))
    components.push(await read('app/components/ui/UiIgnitableCell.vue'), await read('app/error.vue'))
    const compiler = await compile(await read('app/assets/css/main.css'), {
      base: `${root}app/assets/css`, onDependency: () => {},
    })
    const css = compiler.build(components.join(' ').replace(/["'`<>]/g, ' ').split(/\s+/))
    for (const name of ['glow-foot', 'shelf-edge', 'shelf-baseline', 'cell-wash', 'voice-disc-blue',
      'voice-disc-cyan', 'voice-disc-green', 'voice-disc-violet', 'telegram-pill', 'rule-ramp']) {
      expect(css).toContain(`bg-${name}`)
      expect(await read('app/assets/css/utilities.css')).not.toContain(`@utility ${name} {`)
    }
    expect(css).toContain('clip-path: polygon(var(--wedge-shape))')
    expect(css).toContain('clip-path: polygon(var(--wedge-line-shape))')
    expect(css).toContain('background-color: var(--wedge-outline)')
    expect(css).toContain('height: var(--hairline)')
    expect(components[3]).not.toContain('h-[calc(100%+')
    expect(css).toMatch(/\.text-error-action\s*\{\s*font-size: 0\.85rem/)
    expect(css).toMatch(/\.text-service-label\s*\{\s*font-size: 0\.85rem/)
    expect(css).toMatch(/\.gap-community-conversation\s*\{\s*gap: 7px/)
  })

  it('emits native spin for both existing orb compositions and atom consumers', async () => {
    const compiler = await compile(await read('app/assets/css/main.css'), {
      base: `${root}app/assets/css`, onDependency: () => {},
    })
    const components = await Promise.all(['SiteOrb', 'SiteAtom'].map(name =>
      read(`app/components/site/${name}.vue`)))
    const css = compiler.build(components.join(' ').replace(/["'`<>]/g, ' ').split(/\s+/))
    expect(css).toContain('@keyframes spin')
    expect(css).toContain('transform: rotate(360deg)')
    expect(css).toContain('--animate-orb-turn: spin 44s linear infinite')
    expect(css).toContain('--animate-orb-turn-back: spin 68s linear infinite reverse')
    expect(css).not.toContain('@keyframes orb-turn')
  })

  it('emits typed stops and the full motion-controlled transition from the actual component', async () => {
    const component = await read('app/components/site/SiteBackdrop.vue')
    const compiler = await compile(await read('app/assets/css/main.css'), {
      base: `${root}app/assets/css`, onDependency: () => {},
    })
    const css = compiler.build(component.replace(/["<>]/g, ' ').split(/\s+/))
    for (const stop of ['from', 'via', 'to']) {
      expect(css).toContain(`@property --tw-gradient-${stop}`)
      expect(css).toContain(`var(--tw-gradient-${stop})`)
    }
    expect(css).toContain('transition-property: clip-path,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to')
    expect(css).toContain('--duration-field: 550ms')
    expect(css).toContain('transition-duration: var(--duration-field)')
    expect(css).toContain('prefers-reduced-motion: no-preference')
    expect(css.includes(':where([data-mounted], [data-mounted] *)')).toBe(true)
    expect(css).toContain('var(--wedge-corner-reach), var(--wedge-corner), transparent 100%')
    expect(css).toContain('126deg, var(--tw-gradient-from) 0%, var(--tw-gradient-via) 50%, var(--tw-gradient-to) 100%')
    expect(css).not.toMatch(/@property --wedge-(deep|core|bright)/)
  })
})
