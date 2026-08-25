import {afterEach, expect, test, vi} from 'vitest'

import {createDebug, disable} from '@sanity/debug'

afterEach(() => {
  disable()
})

test('the built Node.js package loads and supports ANSI colors', () => {
  const output = vi.fn()
  const log = createDebug('built:node', {log: output, useColors: true})
  log.enabled = true
  log('hello')

  expect(log.useColors).toBe(true)
  expect(typeof log.color).toBe('number')
  expect(String(output.mock.calls[0]?.[0])).toContain('\u001B[')
})
