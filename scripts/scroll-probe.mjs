// Emulate a phone at every size because mobile browser chrome responds to the scrolling container.
import { readArgs, readPage } from './probe-page.mjs'

const { port, url, width, height, reduce, scheme, scripts } = readArgs(
  'usage: bun scripts/scroll-probe.mjs <cdp-port> <url> <width> <height> [reduce] [dark|light] [noscript]')

const expression = `JSON.stringify({
  viewport: { width: window.innerWidth, height: window.innerHeight },
  documentScrolls: document.documentElement.scrollHeight > window.innerHeight + 1,
  regions: [...document.querySelectorAll('[role="region"]')].map(region => {
    const heading = document.getElementById(region.getAttribute('aria-labelledby'))
    return {
      name: heading ? heading.textContent.trim() : '(unnamed)',
      clientHeight: region.clientHeight,
      scrollHeight: region.scrollHeight,
      scrollable: region.scrollHeight > region.clientHeight + 1,
    }
  }),
})`

const reading = await readPage({ port, url, width, height, reduce, scheme, scripts, mobile: true, expression })
console.log(JSON.stringify(reading, null, 2))
process.exit(0)
