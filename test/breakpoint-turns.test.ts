import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Media queries cannot read theme tokens, so their repeated numeric breakpoints must agree.

const CSS_DIR = join(process.cwd(), 'app', 'assets', 'css')
const WIDTH_QUERY = /\(width\s*(>=|<=|>|<)\s*(\d+)px\)/g
const HEIGHT_QUERY = /\(height\s*(>=|<=|>|<)\s*(\d+)px\)/g
const ASPECT_QUERY = /\(aspect-ratio\s*(>=|<=|>|<)\s*([\d/.]+)\)/g

const boundaryOf = (operator: string, pixels: number): number =>
  operator === '>=' || operator === '<' ? pixels - 0.5 : pixels + 0.5

const aspectTurnOf = (operator: string, ratio: string): string =>
  operator === '>=' || operator === '<' ? `${ratio}, square wide` : `${ratio}, square tall`

const turnsIn = (source: string, query: RegExp): number[] =>
  [...source.matchAll(query)].map(match => boundaryOf(match[1]!, Number(match[2])))

const aspectTurnsIn = (source: string): string[] =>
  [...source.matchAll(ASPECT_QUERY)].map(match => aspectTurnOf(match[1]!, match[2]!))

describe('the breakpoint turns', () => {
  const files = readdirSync(CSS_DIR).filter(name => name.endsWith('.css'))
  const sources = files.map(name => readFileSync(join(CSS_DIR, name), 'utf8'))

  const desk = sources.join('\n').match(/--breakpoint-desk:\s*(\d+)px/)
  const deskTurn = boundaryOf('>=', Number(desk?.[1]))

  it('names the desk turn once, as a token', () => {
    expect(desk, 'the theme declares --breakpoint-desk in pixels').not.toBeNull()
  })

  it('turns every width query at the desk turn or at the one field turn', () => {
    const turns = new Set(sources.flatMap(source => turnsIn(source, WIDTH_QUERY)))
    expect([...turns], 'a media query turns at the desk breakpoint').toContain(deskTurn)
    const others = [...turns].filter(turn => turn !== deskTurn)
    expect(others, 'every width query that is not the desk turn is the field turn').toHaveLength(1)
  })

  it('turns every height query at the one height turn', () => {
    const turns = new Set(sources.flatMap(source => turnsIn(source, HEIGHT_QUERY)))
    expect([...turns], 'every height query turns at one boundary').toHaveLength(1)
  })

  it('turns every aspect query at the one aspect turn', () => {
    const turns = new Set(sources.flatMap(aspectTurnsIn))
    expect([...turns], 'every aspect-ratio query turns at one boundary').toHaveLength(1)
  })
})
