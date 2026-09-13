const OPERATION_MS = 30000

export const browserRequest = async (url, options = {}) => {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(OPERATION_MS) })
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  // Reading the body stays under the same abort signal as the request.
  return response.text()
}

export const connect = async (url) => {
  const ws = new WebSocket(url)
  const pending = new Map()
  const awaited = new Map()
  let lastId = 0
  let disconnected
  const waiting = (collection, key, label) => {
    let entry
    const promise = new Promise((resolve, reject) => {
      const finish = (callback, value) => {
        clearTimeout(entry.timer)
        collection.delete(key)
        callback(value)
      }
      entry = {
        resolve: value => finish(resolve, value),
        reject: error => finish(reject, error),
        timer: setTimeout(() => entry.reject(new Error(`${label} timed out`)), OPERATION_MS),
      }
      collection.set(key, entry)
    })
    // Events can fail while their triggering command is still pending.
    void promise.catch(() => {})
    return { promise, entry }
  }
  const fail = (error) => {
    disconnected = error
    for (const entry of [...pending.values(), ...awaited.values()]) entry.reject(error)
  }
  const opened = waiting(awaited, 'socket-open', 'browser socket connection')
  ws.addEventListener('open', () => opened.entry.resolve())
  ws.addEventListener('error', () => fail(new Error('browser socket error')))
  ws.addEventListener('close', () => fail(new Error('browser disconnected')))
  ws.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data)
      const entry = message.id ? pending.get(message.id) : awaited.get(message.method)
      if (!entry) return
      if (message.error) entry.reject(new Error(message.error.message))
      else entry.resolve(message.id ? message.result : message.params)
    }
    catch (error) {
      fail(error)
    }
  })
  try {
    await opened.promise
  }
  catch (error) {
    ws.close()
    throw error
  }
  return {
    send(method, params = {}) {
      if (disconnected) return Promise.reject(disconnected)
      const id = ++lastId
      const { promise, entry } = waiting(pending, id, method)
      try {
        ws.send(JSON.stringify({ id, method, params }))
      }
      catch (error) {
        entry.reject(error)
      }
      return promise
    },
    once(method) {
      if (disconnected) return Promise.reject(disconnected)
      if (awaited.has(method)) throw new Error(`already awaiting ${method}`)
      return waiting(awaited, method, method).promise
    },
    close() {
      fail(new Error('browser connection closed'))
      ws.close()
    },
  }
}

export const withCleanup = async (operation, cleanup) => {
  let value
  let failed = false
  let failure
  try {
    value = await operation()
  }
  catch (error) {
    failed = true
    failure = error
  }
  try {
    await cleanup()
  }
  catch (error) {
    if (failed) throw new AggregateError([failure, error], 'operation and cleanup failed', { cause: error })
    throw error
  }
  if (failed) throw failure
  return value
}
