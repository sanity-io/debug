// @env node

import {isatty} from 'node:tty'
import {formatWithOptions, inspect} from 'node:util'
import {
  createDebug as _createDebug,
  enable as _enable,
  disable,
  enabled,
  namespaces,
} from './core.js'
import {humanize, selectColor} from './utils.js'
import type {Debugger, DebugOptions, InspectOptions} from './types.js'

let env: Record<string, string | undefined> = {}
try {
  void process.env['DEBUG']
  env = process.env
} catch {}

const colors: number[] =
  process.stderr.getColorDepth && process.stderr.getColorDepth(env) > 2
    ? [
        20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62, 63, 68, 69, 74, 75, 76,
        77, 78, 79, 80, 81, 92, 93, 98, 99, 112, 113, 128, 129, 134, 135, 148, 149, 160, 161, 162,
        163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 178, 179, 184, 185, 196, 197, 198,
        199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 214, 215, 220, 221,
      ]
    : [6, 2, 3, 4, 5, 1]

const inspectOpts: InspectOptions = {}
for (const key of Object.keys(env).filter((name) => /^debug_/i.test(name))) {
  const property = key
    .slice(6)
    .toLowerCase()
    .replace(/_([a-z])/g, (_, character: string) => character.toUpperCase())

  const rawValue = env[key]
  const lowerCase = rawValue?.toLowerCase()
  let value: unknown

  if (rawValue === 'null') {
    value = null
  } else if (['yes', 'on', 'true', 'enabled'].includes(lowerCase || '')) {
    value = true
  } else if (['no', 'off', 'false', 'disabled'].includes(lowerCase || '')) {
    value = false
  } else {
    value = Number(rawValue)
  }

  inspectOpts[property] = value
}

/**
 * Is stdout a TTY? Colored output is enabled when `true`.
 */
function useColors(): boolean {
  return 'colors' in inspectOpts ? Boolean(inspectOpts.colors) : isatty(process.stderr.fd)
}

function getDate(options: InspectOptions): string {
  if (options.hideDate) {
    return ''
  }
  return `${new Date().toISOString()} `
}

/**
 * Adds ANSI color escape codes if enabled.
 */
function formatArgs(this: Debugger, diff: number, args: unknown[]): void {
  const {namespace: name, useColors} = this

  if (useColors) {
    const c = this.color
    const colorCode = `\u001B[3${c < 8 ? c : `8;5;${c}`}`
    const prefix = `  ${colorCode};1m${name} \u001B[0m`

    args[0] = prefix + String(args[0]).split('\n').join(`\n${prefix}`)
    args.push(`${colorCode}m+${this.humanize(diff)}\u001B[0m`)
  } else {
    args[0] = `${getDate(this.inspectOpts)}${name} ${args[0]}`
  }
}

function log(this: Debugger, ...args: unknown[]): void {
  process.stderr.write(`${formatWithOptions(this.inspectOpts, ...args)}\n`)
}

const defaultOptions: Omit<Required<DebugOptions>, 'color'> = {
  useColors: useColors(),

  formatArgs,
  formatters: {
    /**
     * Map %o to `util.inspect()`, all on a single line.
     */
    o(v) {
      this.inspectOpts.colors = this.useColors
      return inspect(v, this.inspectOpts)
        .split('\n')
        .map((str) => str.trim())
        .join(' ')
    },

    /**
     * Map %O to `util.inspect()`, allowing multiple lines if needed.
     */
    O(v) {
      this.inspectOpts.colors = this.useColors
      return inspect(v, this.inspectOpts)
    },
  },
  inspectOpts,

  log,
  humanize,
}

export function createDebug(namespace: string, options?: DebugOptions): Debugger {
  const color = (options && options.color) ?? selectColor(colors, namespace)
  const resolvedInspectOptions = {...inspectOpts, ...options?.inspectOpts}
  return _createDebug(namespace, {
    ...defaultOptions,
    ...options,
    color,
    inspectOpts: resolvedInspectOptions,
  })
}

function save(namespaces: string): void {
  if (namespaces) {
    env['DEBUG'] = namespaces
  } else {
    // If you set a process.env field to null or undefined, it gets cast to the
    // string 'null' or 'undefined'. Just delete instead.
    delete env['DEBUG']
  }
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 */
function enable(namespaces: string): void {
  save(namespaces)
  _enable(namespaces)
}

// side-effect
_enable(env['DEBUG'] || '')

export type * from './types.js'
export {disable, enable, enabled, namespaces}
