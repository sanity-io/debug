import {afterEach, describe, expect, test, vi} from 'vitest'

import {createDebug, disable} from '../src/default.js'

afterEach(() => {
  disable()
  vi.restoreAllMocks()
})

describe('default runtime', () => {
  test('never enables color output', () => {
    const log = createDebug('default', {color: 200, useColors: true})
    const output = vi.fn()
    log.enabled = true
    log.log = output

    log('hello')

    expect(log.useColors).toBe(false)
    expect(log.color).toBe(0)
    expect(output).toHaveBeenCalledOnce()
    expect(output.mock.calls[0]).toHaveLength(1)
    expect(String(output.mock.calls[0]?.[0])).toMatch(/^default hello \+\d+ms$/)
    expect(String(output.mock.calls[0]?.[0])).not.toContain('%c')
    expect(String(output.mock.calls[0]?.[0])).not.toContain('\u001B')
  })

  test('formats JSON without relying on a developer console', () => {
    const log = createDebug('default')
    const output = vi.fn()
    log.enabled = true
    log.log = output

    log('value: %j', {ok: true})

    expect(String(output.mock.calls[0]?.[0])).toContain('value: {"ok":true}')
  })

  test('handles circular JSON values', () => {
    const value: Record<string, unknown> = {}
    value['self'] = value

    const log = createDebug('default')
    const output = vi.fn()
    log.enabled = true
    log.log = output
    log('value: %j', value)

    expect(String(output.mock.calls[0]?.[0])).toContain('UnexpectedJSONParseError')
  })

  test('does not leak options between instances', () => {
    const customLog = vi.fn()
    createDebug('custom', {log: customLog})

    expect(createDebug('regular').log).not.toBe(customLog)
  })
})
