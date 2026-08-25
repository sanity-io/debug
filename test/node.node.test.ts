import {formatWithOptions} from 'node:util'

import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {createDebug, disable, enable} from '../src/node.js'
import type {InspectOptions} from '../src/types.js'

vi.mock('node:util', async (importActual) => {
  const actual = await importActual<typeof import('node:util')>()
  return {
    ...actual,
    formatWithOptions: vi.fn(actual.formatWithOptions),
  }
})

const write = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  disable()
})

describe('Node.js runtime', () => {
  test('uses util.formatWithOptions and writes to stderr', () => {
    enable('*')
    createDebug('node')('hello')

    expect(formatWithOptions).toHaveBeenCalledOnce()
    expect(write).toHaveBeenCalledOnce()
  })

  test('passes inspection options to util.formatWithOptions', () => {
    const inspectOpts: InspectOptions = {
      colors: true,
      depth: 10,
      hideDate: true,
      showHidden: true,
    }
    const log = createDebug('inspect', {inspectOpts, useColors: false})
    log.enabled = true
    log('hello')

    expect(formatWithOptions).toHaveBeenCalledWith(
      inspectOpts,
      expect.stringMatching(/^inspect hello$/),
    )
  })

  test('emits ANSI formatting when colors are enabled', () => {
    const output = vi.fn()
    const log = createDebug('color', {useColors: true})
    log.enabled = true
    log.log = output

    log('hello')

    expect(log.useColors).toBe(true)
    expect(typeof log.color).toBe('number')
    expect(String(output.mock.calls[0]?.[0])).toContain('\u001B[')
    expect(String(output.mock.calls[0]?.[1])).toContain('\u001B[')
  })

  test('does not leak options between instances', () => {
    const customLog = vi.fn()
    createDebug('custom', {log: customLog, useColors: true})

    const regular = createDebug('regular')
    expect(regular.log).not.toBe(customLog)
  })
})
