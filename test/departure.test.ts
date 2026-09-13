// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { URL as FileURL } from 'node:url'
import { runInNewContext } from 'node:vm'
import { compileScript, parse } from '@vue/compiler-sfc'
import { mount } from '@vue/test-utils'
import * as vue from 'vue'
import { createMemoryHistory, createRouter, RouterLink } from 'vue-router'
import type { Window } from 'happy-dom'
import ts from 'typescript'
import { describe, expect, it, vi } from 'vitest'
import * as elements from '../app/utils/elements'

const resolveImport = (modules: Record<string, unknown>, id: string) => {
  if (!Object.hasOwn(modules, id)) throw new Error(`Unsupported compiled import: ${id}`)
  return modules[id]
}

it('rejects misspelled compiled imports', () => {
  expect(() => resolveImport({ '~/utils/elements': elements }, '~/utils/elemnts'))
    .toThrow('Unsupported compiled import: ~/utils/elemnts')
})

const component = (name: string, router: ReturnType<typeof createRouter>, selections: unknown[] = []) => {
  const folder = name.startsWith('Ui') ? 'ui' : 'site'
  const input = readFileSync(new FileURL(`../app/components/${folder}/${name}.vue`, import.meta.url), 'utf8')
    .replace('<script setup lang="ts">', `<script setup lang="ts">
import { shallowRef } from 'vue'
import { ELEMENT_TONE, PERIODS, HALOGEN_GROUP } from '~/utils/elements'`)
  const { descriptor } = parse(input)
  const compiled = compileScript(descriptor, { id: name, inlineTemplate: true })
  const source = ts.transpileModule(compiled.content, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
  const NuxtLink = vue.defineComponent({
    props: ['to', 'external', 'noRel'],
    setup: (props, { slots, attrs }) => () => props.external !== undefined || /^https?:/.test(props.to)
      ? vue.h('a', { ...attrs, href: props.to }, slots.default?.())
      : vue.h(RouterLink, { ...attrs, to: props.to }, slots),
  })
  return runInNewContext(`${source}\nexports.default`, {
    exports: {}, useRouter: () => router, useI18n: () => ({ t: (key: string) => key }),
    location: window.location,
    require: (id: string) => resolveImport({
      'vue': {
        ...vue,
        shallowRef: () => {
          const ref = vue.shallowRef()
          vue.watch(ref, (value) => {
            if (value) selections.push(value)
          }, { flush: 'sync' })
          return ref
        },
      },
      '#components': { NuxtLink },
      '~/utils/elements': elements,
    }, id),
  })
}

const setup = async () => {
  const router = createRouter({ history: createMemoryHistory(), routes: ['/', '/features', '/community', '/devices']
    .map(path => ({ path, component: { render: () => null } })) })
  await router.push('/')
  const selections: { to: string, navigation: ReturnType<typeof router.push> }[] = []
  const push = vi.spyOn(router, 'push')
  const wrapper = mount(component('SiteElementNav', router, selections), { global: {
    plugins: [router], components: {
      SiteElementCell: component('SiteElementCell', router),
      UiIgnitableCell: component('UiIgnitableCell', router),
      SiteNeighbourCell: { render: () => null },
    },
  } })
  return { router, wrapper, selections, push }
}

const nextTurn = () => new Promise(resolve => setTimeout(resolve, 0))

describe('compiled arrival navigation', () => {
  it.each([false, true])('retains selection through an older cancellation; same destination=%s', async (same) => {
    const { router, wrapper, selections, push } = await setup()
    try {
      const releases: (() => void)[] = []
      router.beforeEach(() => new Promise<void>(resolve => releases.push(resolve)))
      const click = (path: string) => wrapper.get(`a[href="${path}"]`).trigger('click', { button: 0 })
      await click('/features')
      await nextTurn()
      const target = same ? '/features' : '/community'
      await click(target)
      await nextTurn()
      expect(releases).toHaveLength(2)
      expect(push).toHaveBeenCalledTimes(2)
      expect(selections).toHaveLength(2)
      selections.forEach((selection, index) => expect(selection.navigation).toBe(push.mock.results[index]!.value))
      releases[0]!()
      await nextTurn()
      expect(wrapper.get(`a[href="${target}"]`).classes()).toContain('[view-transition-name:tapped]')
      expect(wrapper.findAll('.\\[view-transition-name\\:tapped\\]')).toHaveLength(1)
      releases[1]!()
      await nextTurn()
      expect(router.currentRoute.value.path).toBe(target)
      expect(wrapper.html()).not.toContain('[view-transition-name:tapped]')
    }
    finally {
      wrapper.unmount()
    }
  })

  it('retains selection throughout a delayed navigation and clears a refused navigation', async () => {
    const { router, wrapper, selections, push } = await setup()
    try {
      let release!: (value: false) => void
      router.beforeEach(() => new Promise<false>((resolve) => {
        release = resolve
      }))
      await wrapper.get('a[href="/features"]').trigger('click', { button: 0 })
      await new Promise(resolve => setTimeout(resolve, 40))
      expect(push).toHaveBeenCalledTimes(1)
      expect(selections).toHaveLength(1)
      expect(selections[0]!.navigation).toBe(push.mock.results[0]!.value)
      expect(wrapper.get('a[href="/features"]').classes()).toContain('[view-transition-name:tapped]')
      release(false)
      await nextTurn()
      expect(router.currentRoute.value.path).toBe('/')
      expect(wrapper.html()).not.toContain('[view-transition-name:tapped]')
    }
    finally {
      wrapper.unmount()
    }
  })

  it('does not select modified, prevented, external, download or non-primary clicks', async () => {
    const { router, wrapper, selections, push } = await setup()
    const { happyDOM } = window as unknown as Window
    const navigation = { ...happyDOM.settings.navigation }
    const url = window.location.href
    // Native anchor defaults can open child pages in Happy DOM.
    Object.assign(happyDOM.settings.navigation, {
      disableMainFrameNavigation: true, disableChildPageNavigation: true, disableFallbackToSetURL: true,
    })
    try {
      const link = wrapper.get('a[href="/features"]').element
      for (const options of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true },
        { button: 1 }, { prevented: true }, { download: true }, { target: '_blank' }]) {
        if ('download' in options) link.setAttribute('download', '')
        if ('target' in options) link.setAttribute('target', options.target!)
        const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...options })
        if ('prevented' in options) event.preventDefault()
        push.mockClear()
        link.dispatchEvent(event)
        expect(event.defaultPrevented).toBe('prevented' in options || 'download' in options)
        expect(selections).toEqual([])
        expect(push).toHaveBeenCalledTimes('download' in options ? 1 : 0)
        await nextTurn()
        // RouterLink itself navigates a download-attributed internal link; the table must not select it.
        if ('download' in options) {
          expect(router.currentRoute.value.path).toBe('/features')
          await router.push('/')
        }
        else expect(router.currentRoute.value.path).toBe('/')
        expect(wrapper.html()).not.toContain('[view-transition-name:tapped]')
        link.removeAttribute('download')
        link.removeAttribute('target')
      }
      await wrapper.get('a[href^="https:"]').trigger('click', { button: 0 })
      expect(router.currentRoute.value.path).toBe('/')
      expect(wrapper.html()).not.toContain('[view-transition-name:tapped]')
      await happyDOM.waitUntilComplete()
      expect(window.location.href).toBe(url)
    }
    finally {
      try {
        wrapper.unmount()
        await happyDOM.abort()
      }
      finally {
        Object.assign(happyDOM.settings.navigation, navigation)
      }
    }
  })
})
