import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Enforces the styling rules mechanically: a static style attribute may set only custom
// properties, and a template names no colour value.

const vueFilesUnder = (dir: string): string[] => {
  const found: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) found.push(...vueFilesUnder(path))
    else if (name.endsWith('.vue')) found.push(path)
  }
  return found
}

// An SVG presentation attribute (`stroke="oklch(…)"`, `fill="…"`) is not a style
// attribute, so the colour check reads the whole template block. Only the template: a
// script may name a mask's own black and white, which no theme would change.
const TEMPLATE_BLOCK = /<template[\s>][\s\S]*<\/template>/
const RAW_COLOUR = /oklch\(|rgba?\(|hsla?\(|#[0-9a-fA-F]{3,8}\b|--_base-|--_accent-/g

const STATIC_STYLE = /(?<![:\w-])style="([^"]*)"/g

const offendersIn = (source: string): string[] => {
  const offenders: string[] = []
  for (const match of source.matchAll(STATIC_STYLE)) {
    const declarations = match[1]!
      .split(';')
      .map(declaration => declaration.trim())
      .filter(declaration => declaration.length > 0)
    for (const declaration of declarations) {
      if (!declaration.startsWith('--')) offenders.push(declaration)
    }
  }
  return offenders
}

const rawColoursIn = (source: string): string[] => {
  const template = TEMPLATE_BLOCK.exec(source)
  if (template === null) return []
  return [...template[0].matchAll(RAW_COLOUR)].map(match => match[0])
}

describe('the styling law', () => {
  it('lets a static style attribute set only custom properties', () => {
    for (const file of vueFilesUnder(join(process.cwd(), 'app'))) {
      const offenders = offendersIn(readFileSync(file, 'utf8'))
      expect(offenders, `${file} sets a CSS property in a style attribute`).toEqual([])
    }
  })

  it('keeps every colour in a template behind a named role', () => {
    for (const file of vueFilesUnder(join(process.cwd(), 'app'))) {
      const offenders = rawColoursIn(readFileSync(file, 'utf8'))
      expect(offenders, `${file} names a colour value in its template`).toEqual([])
    }
  })
})
