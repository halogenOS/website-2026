import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const filesUnder = (dir: string, extension: string): string[] => {
  const found: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) found.push(...filesUnder(path, extension))
    else if (name.endsWith(extension)) found.push(path)
  }
  return found
}

const filesContaining = (dir: string, extension: string, marker: string): string[] =>
  filesUnder(dir, extension).filter(file => readFileSync(file, 'utf8').includes(marker))

describe('the shapes a new depth copies', () => {
  it('composes the ignitable cell surface in one place', () => {
    const carriers = filesContaining(
      join(process.cwd(), 'app'),
      '.vue',
      'ignited:border-[color:var(--element)]',
    )
    expect(carriers, 'the cell surface is assembled per component').toHaveLength(1)
  })

  it('writes the depth page skeleton in one place', () => {
    const carriers = filesContaining(join(process.cwd(), 'app'), '.vue', 'min-h-(--field-clearance)')
    expect(carriers, 'the depth page skeleton is written per page').toHaveLength(1)
  })
})

describe('the rules the Community depth settled', () => {
  // A mark beside its printed name is decorative, so screen readers should hear the name only once.
  it('never announces a lockup mark with the word printed beside it', () => {
    const doubled = filesUnder(join(process.cwd(), 'app'), '.vue').filter((file) => {
      const source = readFileSync(file, 'utf8')
      return [...source.matchAll(/:alt="([^"]+)"/g)]
        .some(([, expression]) => source.includes(`{{ ${expression} }}`))
    })
    expect(doubled, 'a mark is announced with the word printed beside it').toEqual([])
  })
})
