import {afterEach, expect, test, vi} from 'vitest'

import {createDebug, disable} from '@sanity/debug'

afterEach(() => {
  disable()
})

test('the built default package loads and never emits colors', () => {
  const output = vi.fn()
  const log = createDebug('built:default', {
    color: 200,
    log: output,
    useColors: true,
  })
  log.enabled = true
  log('hello')

  expect(log.useColors).toBe(false)
  expect(output).toHaveBeenCalledOnce()
  expect(String(output.mock.calls[0]?.[0])).toMatch(/^built:default hello \+\d+ms$/)
  expect(String(output.mock.calls[0]?.[0])).not.toContain('%c')
  expect(String(output.mock.calls[0]?.[0])).not.toContain('\u001B')
})
