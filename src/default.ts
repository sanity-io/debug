// @env browser

import {
  createDebug as _createDebug,
  disable,
  enable as _enable,
  enabled,
  namespaces,
} from './core.js'
import type {Debugger, DebugOptions} from './types.js'
import {humanize} from './utils.js'

function formatArgs(this: Debugger, diff: number, args: unknown[]): void {
  args[0] = `${this.namespace} ${args[0]} +${this.humanize(diff)}`
}

const log =
  typeof console === 'undefined'
    ? (): void => {}
    : (...args: unknown[]): void => (console.debug || console.log)(...args)

const defaultOptions: Required<DebugOptions> = {
  color: 0,
  formatArgs,
  formatters: {
    j(value): string {
      try {
        return JSON.stringify(value)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        return `[UnexpectedJSONParseError]: ${message}`
      }
    },
  },
  humanize,
  inspectOpts: {},
  log,
  useColors: false,
}

export function createDebug(namespace: string, options?: DebugOptions): Debugger {
  return _createDebug(namespace, {
    ...defaultOptions,
    ...options,
    // Color formatting is intentionally exclusive to the Node.js entry.
    color: 0,
    useColors: false,
  })
}

function getStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

const storage = getStorage()

function load(): string {
  try {
    return storage?.getItem('debug') || storage?.getItem('DEBUG') || ''
  } catch {
    return ''
  }
}

function save(value: string): void {
  try {
    if (value) {
      storage?.setItem('debug', value)
    } else {
      storage?.removeItem('debug')
    }
  } catch {
    // Debug logging must not fail when storage is unavailable.
  }
}

function enable(value: string): void {
  save(value)
  _enable(value)
}

_enable(load())

export type * from './types.js'
export {disable, enable, enabled, namespaces}
