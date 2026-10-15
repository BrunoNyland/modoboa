import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { mdiIcons } from './icons'

// Every 'mdi-*' name written in the sources must be in the SVG map: an
// unmapped name renders an empty button (and a console error), as the
// "group into conversations" toggle did.
const SRC = join(process.cwd(), 'src')

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      return name === 'locale' ? [] : sourceFiles(path)
    }
    return /\.(vue|js)$/.test(name) && !name.endsWith('.spec.js') ? [path] : []
  })
}

describe('icons', () => {
  it('maps every mdi icon used in the sources', () => {
    const missing = new Set()
    for (const file of sourceFiles(SRC)) {
      const content = readFileSync(file, 'utf8')
      for (const [, name] of content.matchAll(/['"`](mdi-[a-z0-9-]+)['"`]/g)) {
        if (!(name in mdiIcons)) {
          missing.add(`${name} (${file.slice(SRC.length + 1)})`)
        }
      }
    }
    expect([...missing]).toEqual([])
  })
})
