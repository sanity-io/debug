import {coerce, matchesTemplate} from './utils.js'
import type {Debugger, DebugOptions} from './types.js'

let globalNamespaces: string = ''

/**
 * Returns a string of the currently enabled debug namespaces.
 */
export function namespaces(): string {
  return globalNamespaces
}

export function createDebug(namespace: string, options: Required<DebugOptions>): Debugger {
  let prevTime: number | undefined
  let enableOverride: boolean | undefined
  let namespacesCache: string | undefined
  let enabledCache: boolean | undefined

  function writeDebug(...args: unknown[]): void {
    if (!debug.enabled) {
      return
    }

    const curr = Date.now()
    const ms = curr - (prevTime || curr)
    const diff = ms
    prevTime = curr

    args[0] = coerce(args[0])
    if (typeof args[0] !== 'string') {
      // Anything else let's inspect with %O
      args.unshift('%O')
    }

    // Apply any `formatters` transformations
    let index = 0
    args[0] = String(args[0]).replace(/%([a-z%])/gi, (match, format) => {
      // If we encounter an escaped % then don't increase the array index
      if (match === '%%') return '%'

      index++
      const formatter = options.formatters[format]
      if (typeof formatter === 'function') {
        const value = args[index]
        match = formatter.call(debug, value)

        // Now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1)
        index--
      }
      return match
    })

    // Apply env-specific formatting (colors, etc.)
    options.formatArgs.call(debug, diff, args)

    debug.log(...args)
  }

  const debug: Debugger = Object.assign(writeDebug, options, {
    enabled: false,
    namespace,
    extend(this: Debugger, childNamespace: string, delimiter = ':'): Debugger {
      return createDebug(this.namespace + delimiter + childNamespace, {
        useColors: this.useColors,
        color: this.color,
        formatArgs: this.formatArgs,
        formatters: this.formatters,
        inspectOpts: this.inspectOpts,
        log: this.log,
        humanize: this.humanize,
      })
    },
  })

  Object.defineProperty(debug, 'enabled', {
    enumerable: true,
    configurable: false,
    get: () => {
      if (enableOverride != null) {
        return enableOverride
      }
      if (namespacesCache !== globalNamespaces) {
        namespacesCache = globalNamespaces
        enabledCache = enabled(namespace)
      }

      return enabledCache
    },
    set: (v) => {
      enableOverride = v
    },
  })

  return debug
}

let names: string[] = []
let skips: string[] = []

export function enable(namespaces: string): void {
  globalNamespaces = namespaces

  names = []
  skips = []

  const split = globalNamespaces.trim().replace(/\s+/g, ',').split(',').filter(Boolean)

  for (const ns of split) {
    if (ns[0] === '-') {
      skips.push(ns.slice(1))
    } else {
      names.push(ns)
    }
  }
}

/**
 * Disable debug output.
 */
export function disable(): string {
  const namespaces = [...names, ...skips.map((namespace) => `-${namespace}`)].join(',')
  enable('')
  return namespaces
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 */
export function enabled(name: string): boolean {
  for (const skip of skips) {
    if (matchesTemplate(name, skip)) {
      return false
    }
  }

  for (const ns of names) {
    if (matchesTemplate(name, ns)) {
      return true
    }
  }

  return false
}
