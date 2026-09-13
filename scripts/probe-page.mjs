// Run a bounded browser in a separate foreground terminal from the project root:
//
//   timeout 120s chromium --headless --disable-gpu \
//     --force-device-scale-factor=1 --remote-debugging-address=127.0.0.1 \
//     --remote-debugging-port=9222 --user-data-dir=.cache/nav-probe-profile about:blank
//
// Use a dedicated profile and port for each run; finish probes before the browser's deadline.
import { browserRequest, connect, withCleanup } from './probe-connection.mjs'

export const readArgs = (usage) => {
  const [, , port, url, width, height, ...words] = process.argv
  if (!port || !url || !width || !height) {
    console.error(usage)
    process.exit(2)
  }
  const unknown = words.filter(word => !['reduce', 'dark', 'light', 'noscript'].includes(word))
  if (unknown.length > 0 || (words.includes('dark') && words.includes('light'))) {
    console.error('after the window come only the words `reduce`, `noscript`, and one of `dark` or `light`')
    process.exit(2)
  }
  const scheme = words.includes('dark') ? 'dark' : (words.includes('light') ? 'light' : null)
  return {
    port, url, width: Number(width), height: Number(height),
    reduce: words.includes('reduce'), scheme, scripts: !words.includes('noscript'),
  }
}

export const featuresOf = ({ reduce, scheme }) => [
  { name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' },
  ...(scheme === null ? [] : [{ name: 'prefers-color-scheme', value: scheme }]),
]

const HYDRATION_DEADLINE_MS = 15000

// An ordinary document script obeys the target's script setting; privileged CDP injections do not.
const SCRIPT_CONTROL = 'data:text/html,' + encodeURIComponent(
  '<!doctype html><html><body><script>document.body.dataset.executed="yes"</script></body></html>',
)

// Vue sets `__vue_app__` on mount; server markup cannot supply this hydration signal.
const HYDRATED = `(async () => {
  const deadline = performance.now() + ${HYDRATION_DEADLINE_MS}
  while (document.getElementById('__nuxt')?.__vue_app__ === undefined) {
    if (performance.now() > deadline) throw new Error('the app did not hydrate within ${HYDRATION_DEADLINE_MS} ms')
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  await document.fonts.ready
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  return 'hydrated'
})()`

// With page scripts disabled, promises cannot resolve; poll font status synchronously through CDP.
const PAINTED = `document.readyState === 'complete' && document.fonts.status === 'loaded'`

const CONDITIONS = `JSON.stringify({
  width: window.innerWidth,
  height: window.innerHeight,
  scheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  path: location.pathname,
  hydrated: document.getElementById('__nuxt')?.__vue_app__ !== undefined,
})`

// Opens a page and returns CDP send, evaluate and close functions plus the observed scheme and script conditions.
// It verifies the requested path, viewport, scheme and script setting before returning.
// Viewport size alone does not select phone emulation (viewport meta, overlay scrollbars and text sizing).
export const openPage = async ({ port, url, width, height, features, mobile = false, scripts = true }) => {
  let browser
  let browserContextId
  let connection
  // A context contains child tabs too, including modified clicks with no reported opener.
  // Register cleanup before acquisition; disconnect also disposes a context if a command times out.
  const close = () => withCleanup(
    () => withCleanup(async () => connection?.close(), async () => {
      if (browserContextId) await browser.send('Target.disposeBrowserContext', { browserContextId })
    }),
    async () => browser?.close(),
  )
  const send = (method, params) => connection.send(method, params)
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true,
    })
    if (exceptionDetails) {
      throw new Error(`${url}: ${exceptionDetails.exception?.description ?? 'the expression threw'}`)
    }
    return result.value
  }

  let scheme
  let conditions
  try {
    const version = JSON.parse(await browserRequest(`http://127.0.0.1:${port}/json/version`))
    browser = await connect(version.webSocketDebuggerUrl)
    ;({ browserContextId } = await browser.send('Target.createBrowserContext', { disposeOnDetach: true }))
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank', browserContextId })
    const targets = JSON.parse(await browserRequest(`http://127.0.0.1:${port}/json/list`))
    const target = targets.find(target => target.id === targetId)
    if (!target) throw new Error(`browser target ${targetId} is absent`)
    connection = await connect(target.webSocketDebuggerUrl)

    await send('Page.enable')
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile })
    // Set media before navigation so the initial layout uses the requested conditions.
    await send('Emulation.setEmulatedMedia', { features })
    await send('Emulation.setScriptExecutionDisabled', { value: !scripts })
    const controlLoaded = connection.once('Page.loadEventFired')
    const control = await send('Page.navigate', { url: SCRIPT_CONTROL })
    if (control.errorText) throw new Error(`script control: ${control.errorText}`)
    await controlLoaded
    const scriptsExecuted = await evaluate('document.body.dataset.executed === "yes"')
    if (scriptsExecuted !== scripts) {
      throw new Error(`script control disagrees: requested ${scripts}, observed ${scriptsExecuted}`)
    }
    const loaded = connection.once('Page.loadEventFired')
    const navigated = await send('Page.navigate', { url })
    if (navigated.errorText) throw new Error(`${url}: ${navigated.errorText}`)
    await loaded.catch((cause) => {
      throw new Error(`${url}: ${cause.message}`, { cause })
    })
    const responseStatus = await evaluate(`performance.getEntriesByType('navigation')[0]?.responseStatus`)
    if (!Number.isInteger(responseStatus) || responseStatus < 200 || responseStatus >= 300) {
      throw new Error(`${url}: final document HTTP status is ${responseStatus}`)
    }
    if (scripts) {
      await evaluate(HYDRATED)
    }
    else {
      const deadline = Date.now() + HYDRATION_DEADLINE_MS
      while (await evaluate(PAINTED) !== true) {
        if (Date.now() > deadline) throw new Error(`${url} did not finish painting within ${HYDRATION_DEADLINE_MS} ms`)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }

    const found = JSON.parse(await evaluate(CONDITIONS))
    // Redirects can produce plausible measurements from the wrong page.
    const askedPath = new URL(url).pathname
    if (found.path !== askedPath) {
      throw new Error(`asked for ${askedPath}, the page loaded is ${found.path}`)
    }
    if (found.width !== width || found.height !== height) {
      throw new Error(`asked for ${width}x${height}, the page reports ${found.width}x${found.height}`)
    }
    const asked = features.find(feature => feature.name === 'prefers-color-scheme')?.value
    if (asked !== undefined && found.scheme !== asked) {
      throw new Error(`asked for the ${asked} scheme, the page computes ${found.scheme}`)
    }
    if (found.hydrated !== scripts) {
      throw new Error(`script conditions disagree: requested ${scripts}, observed ${JSON.stringify(found)}`)
    }
    conditions = { scripts, scriptsExecuted, hydrated: found.hydrated }
    scheme = found.scheme
  }
  catch (failure) {
    return withCleanup(() => {
      throw failure
    }, close)
  }
  return { send, evaluate, close, scheme, conditions }
}

export const readPage = async ({
  port, url, width, height, reduce, scheme = null, mobile = false, scripts = true, expression,
}) => {
  const page = await openPage({ port, url, width, height, mobile, scripts, features: featuresOf({ reduce, scheme }) })
  return withCleanup(async () => ({
    ...JSON.parse(await page.evaluate(expression)), scheme: page.scheme, ...page.conditions,
  }), page.close)
}
