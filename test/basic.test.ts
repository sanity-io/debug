import {afterEach, describe, expect, test, vi} from 'vitest'

import {createDebug, disable, enable, enabled, namespaces} from '@sanity/debug'

afterEach(() => {
  disable()
  vi.restoreAllMocks()
})

describe('debug', () => {
  test('does not log until its namespace is enabled', () => {
    const log = createDebug('app:request')
    const output = vi.fn()
    log.log = output

    log('hidden')
    expect(output).not.toHaveBeenCalled()

    enable('app:*')
    log('visible')
    expect(output).toHaveBeenCalledOnce()
  })

  test('supports includes, exclusions, and wildcards', () => {
    enable('app:*,-app:secret*')

    expect(enabled('app:request')).toBe(true)
    expect(enabled('app:secret')).toBe(false)
    expect(enabled('app:secret:key')).toBe(false)
    expect(enabled('other')).toBe(false)
  })

  test('normalizes whitespace-separated namespaces', () => {
    enable('app:* worker:*')

    expect(namespaces()).toBe('app:* worker:*')
    expect(enabled('app:request')).toBe(true)
    expect(enabled('worker:request')).toBe(true)
  })

  test('returns the previous namespace selection when disabled', () => {
    enable('app:*,worker:*,-app:secret')

    expect(disable()).toBe('app:*,worker:*,-app:secret')
    expect(namespaces()).toBe('')
  })

  test('supports a per-instance enabled override', () => {
    const log = createDebug('forced')
    const output = vi.fn()
    log.log = output
    log.enabled = true

    log('visible')
    expect(output).toHaveBeenCalledOnce()
  })

  test('extends namespaces and inherits custom behavior', () => {
    const parent = createDebug('app', {
      humanize: (value) => `${value} milliseconds`,
    })
    const output = vi.fn()
    parent.log = output
    parent.enabled = true

    const child = parent.extend('request')
    child.enabled = true
    child('hello')

    expect(child.namespace).toBe('app:request')
    expect(child.log).toBe(output)
    expect(child.humanize).toBe(parent.humanize)
  })

  test('supports custom namespace delimiters', () => {
    const parent = createDebug('app')

    expect(parent.extend('request', '--').namespace).toBe('app--request')
    expect(parent.extend('request', '').namespace).toBe('apprequest')
  })

  test('coerces errors before logging', () => {
    const log = createDebug('app')
    const output = vi.fn()
    log.log = output
    log.enabled = true

    log(new Error('broken'))

    expect(String(output.mock.calls[0]?.[0])).toContain('broken')
  })

  test('applies custom formatters', () => {
    const log = createDebug('app', {
      formatters: {
        h(value) {
          return `<${String(value)}>`
        },
      },
    })
    const output = vi.fn()
    log.log = output
    log.enabled = true

    log('value: %h', 42)

    expect(String(output.mock.calls[0]?.[0])).toContain('value: <42>')
  })
})
