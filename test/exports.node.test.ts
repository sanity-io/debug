import {describe, expect, test} from 'vitest'

import pkg from '../package.json'

function resolveEntry(conditions: string[]): string {
  for (const [condition, target] of Object.entries(pkg.exports['.'])) {
    if (condition === 'default' || conditions.includes(condition)) {
      return target
    }
  }

  throw new Error(`No export matched conditions: ${conditions.join(', ')}`)
}

const DEFAULT = './dist/default.js'
const NODE = './dist/node.js'

describe('package exports', () => {
  test.each([
    ['Node.js', ['node', 'import']],
    ['Deno', ['deno', 'node', 'import']],
    ['Bun', ['bun', 'node', 'import']],
  ])('uses the Node.js build for %s', (_runtime, conditions) => {
    expect(resolveEntry(conditions)).toBe(NODE)
  })

  test.each([
    ['browser', ['browser', 'node', 'import']],
    ['React Server', ['react-server', 'node', 'import']],
    ['workerd', ['workerd', 'worker', 'browser', 'import']],
    ['web workers', ['worker', 'browser', 'import']],
    ['unknown runtimes', ['import']],
  ])('uses the default build for %s', (_runtime, conditions) => {
    expect(resolveEntry(conditions)).toBe(DEFAULT)
  })

  test('publishes only ESM entry points', () => {
    expect(pkg.type).toBe('module')
    expect(Object.values(pkg.exports['.']).every((target) => target.endsWith('.js'))).toBe(true)
    expect('main' in pkg).toBe(false)
    expect('module' in pkg).toBe(false)
  })

  test('does not advertise JSR or CDN bundles', () => {
    expect('unpkg' in pkg).toBe(false)
    expect('jsdelivr' in pkg).toBe(false)
  })

  test('requires Node.js 22.12 or newer', () => {
    expect(pkg.engines.node).toBe('>=22.12.0')
  })
})
