import { afterEach, describe, expect, it, vi } from 'vitest'
import { browserRequest, connect, withCleanup } from '../scripts/probe-connection.mjs'
import { openPage } from '../scripts/probe-page.mjs'

class Socket extends EventTarget {
  static latest: Socket
  sent: { id: number, method: string }[] = []
  closed = false
  constructor() {
    super()
    Socket.latest = this
  }

  send(text: string) {
    this.sent.push(JSON.parse(text))
  }

  close() {
    this.closed = true
    this.dispatchEvent(new Event('close'))
  }

  message(value: unknown) {
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(value) }))
  }
}

const connected = async () => {
  vi.stubGlobal('WebSocket', Socket)
  const promise = connect('ws://browser.invalid')
  Socket.latest.dispatchEvent(new Event('open'))
  return promise
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('bounded browser operations', () => {
  it('times out a socket that never opens and closes it', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('WebSocket', Socket)
    const promise = connect('ws://browser.invalid')
    const assertion = expect(promise).rejects.toThrow('connection timed out')
    await vi.advanceTimersByTimeAsync(30000)
    await assertion
    expect(Socket.latest.closed).toBe(true)
  })

  it('times out missing command responses and events', async () => {
    vi.useFakeTimers()
    const connection = await connected()
    const command = expect(connection.send('Page.enable')).rejects.toThrow('Page.enable timed out')
    const event = expect(connection.once('Page.loadEventFired')).rejects.toThrow('Page.loadEventFired timed out')
    await vi.advanceTimersByTimeAsync(30000)
    await Promise.all([command, event])
    connection.close()
  })

  it('rejects pending and future work immediately on disconnect', async () => {
    const connection = await connected()
    const command = expect(connection.send('Page.enable')).rejects.toThrow('disconnected')
    const event = expect(connection.once('Page.loadEventFired')).rejects.toThrow('disconnected')
    Socket.latest.close()
    await Promise.all([command, event])
    await expect(connection.send('Page.navigate')).rejects.toThrow('disconnected')
    await expect(connection.once('Page.loadEventFired')).rejects.toThrow('disconnected')
  })

  it('distinguishes protocol errors from successful command results', async () => {
    const connection = await connected()
    const failure = expect(connection.send('Page.enable')).rejects.toThrow('refused')
    Socket.latest.message({ id: 1, error: { message: 'refused' } })
    await failure
    const success = connection.send('Page.enable')
    Socket.latest.message({ id: 2, result: { enabled: true } })
    await expect(success).resolves.toEqual({ enabled: true })
    connection.close()
  })

  it('bounds HTTP requests including response bodies and rejects unsuccessful cleanup responses', async () => {
    const request = vi.fn().mockResolvedValue(new Response('not closed', { status: 500 }))
    vi.stubGlobal('fetch', request)
    await expect(browserRequest('http://browser.invalid/close')).rejects.toThrow('HTTP 500')
    expect(request.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal)
    request.mockResolvedValue(new Response('closed'))
    await expect(browserRequest('http://browser.invalid/close')).resolves.toBe('closed')
  })

  it('disposes the context after target acquisition fails and retains disposal failure too', async () => {
    const commands: string[] = []
    vi.stubGlobal('WebSocket', class extends Socket {
      constructor() {
        super()
        queueMicrotask(() => this.dispatchEvent(new Event('open')))
      }

      override send(text: string) {
        const { id, method } = JSON.parse(text)
        commands.push(method)
        queueMicrotask(() => this.message(method === 'Target.createBrowserContext'
          ? { id, result: { browserContextId: 'context' } }
          : { id, error: { message: method === 'Target.createTarget' ? 'target failed' : 'disposal failed' } }))
      }
    })
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      webSocketDebuggerUrl: 'ws://browser.invalid',
    }))))
    const failure = await openPage({ port: 1, url: 'http://page.invalid', width: 390, height: 844, features: [] })
      .catch((error: AggregateError) => error)
    expect(failure).toBeInstanceOf(AggregateError)
    expect(failure.errors.map((error: Error) => error.message)).toEqual(['target failed', 'disposal failed'])
    expect(commands).toEqual(['Target.createBrowserContext', 'Target.createTarget', 'Target.disposeBrowserContext'])
    expect(Socket.latest.closed).toBe(true)
  })

  it.each([true, false])('validates independent control and hydration readings for scripts=%s', async (scripts) => {
    const commands: { method: string, params: Record<string, unknown> }[] = []
    let observed = scripts
    let controlObserved: boolean | undefined = scripts
    let responseStatus: unknown = 200
    vi.stubGlobal('WebSocket', class extends Socket {
      constructor() {
        super()
        queueMicrotask(() => this.dispatchEvent(new Event('open')))
      }

      override send(text: string) {
        const command = JSON.parse(text)
        commands.push(command)
        queueMicrotask(() => {
          const expression = command.params?.expression ?? ''
          const value = expression.includes('JSON.stringify')
            ? JSON.stringify({ width: 390, height: 844, scheme: 'light', path: '/privacy',
                hydrated: observed })
            : expression.includes('responseStatus')
              ? responseStatus
              : expression.includes('dataset.executed') ? controlObserved : true
          const result = command.method === 'Target.createBrowserContext'
            ? { browserContextId: 'context' }
            : command.method === 'Target.createTarget' ? { targetId: 'target' } : { result: { value } }
          this.message({ id: command.id, result })
          if (command.method === 'Page.navigate') this.message({ method: 'Page.loadEventFired', params: {} })
        })
      }
    })
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(url.endsWith('/json/list')
      ? [{ id: 'target', webSocketDebuggerUrl: 'ws://target.invalid' }]
      : { webSocketDebuggerUrl: 'ws://browser.invalid' }))))
    const options = { port: 1, url: 'http://page.invalid/privacy', width: 390, height: 844, features: [], scripts }
    const page = await openPage(options)
    expect(page.conditions).toEqual({ scripts, scriptsExecuted: scripts, hydrated: scripts })
    expect(commands).toContainEqual(expect.objectContaining({
      method: 'Emulation.setScriptExecutionDisabled', params: { value: !scripts },
    }))
    expect(commands.findIndex(command => command.method === 'Emulation.setScriptExecutionDisabled'))
      .toBeLessThan(commands.findIndex(command => command.method === 'Page.navigate'))
    expect(commands.some(command => command.method === 'Page.addScriptToEvaluateOnNewDocument')).toBe(false)
    const navigations = commands.filter(command => command.method === 'Page.navigate')
    expect(decodeURIComponent(String(navigations[0]?.params.url))).toContain('<script>document.body.dataset.executed=')
    expect(navigations[1]?.params.url).toBe(options.url)
    await page.close()
    for (const invalid of [undefined, null, '200', 0, 199, 300, 404, 500, 200.5]) {
      responseStatus = invalid
      const before = commands.filter(command => command.method === 'Page.navigate').length
      await expect(openPage(options)).rejects.toThrow('final document HTTP status')
      expect(commands.filter(command => command.method === 'Page.navigate').length - before).toBe(2)
      expect(Socket.latest.closed).toBe(true)
    }
    responseStatus = 200
    for (const invalid of [!scripts, undefined]) {
      controlObserved = invalid
      await expect(openPage(options)).rejects.toThrow('script control disagrees')
      expect(Socket.latest.closed).toBe(true)
    }
    controlObserved = scripts
    observed = !scripts
    await expect(openPage(options)).rejects.toThrow('script conditions disagree')
    expect(Socket.latest.closed).toBe(true)
  })

  it('does not replace an operation failure with a cleanup failure', async () => {
    const original = new Error('reading failed')
    const cleanup = new Error('close failed')
    const failReading = () => {
      throw original
    }
    const failCleanup = () => {
      throw cleanup
    }
    const failure = await withCleanup(failReading, failCleanup).catch((error: AggregateError) => error)
    expect(failure.errors).toEqual([original, cleanup])
    expect(failure.cause).toBe(cleanup)
    await expect(withCleanup(() => 1, failCleanup)).rejects.toBe(cleanup)
    await expect(withCleanup(failReading, () => {})).rejects.toBe(original)
    await expect(withCleanup(() => 1, () => {})).resolves.toBe(1)
  })

  it('propagates an abort while response body reading is pending', async () => {
    const controller = new AbortController()
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal)
    vi.stubGlobal('fetch', vi.fn(async (_url: string, options: RequestInit) => ({
      ok: true,
      text: () => new Promise((_resolve, reject) => {
        options.signal?.addEventListener('abort', () => reject(options.signal?.reason))
      }),
    })))
    try {
      const reading = browserRequest('http://browser.invalid/new')
      const assertion = expect(reading).rejects.toThrow('body deadline')
      await Promise.resolve()
      controller.abort(new Error('body deadline'))
      await assertion
      expect(timeout).toHaveBeenCalledWith(30000)
    }
    finally {
      timeout.mockRestore()
    }
  })
})
