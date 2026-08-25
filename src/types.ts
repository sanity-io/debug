export interface InspectOptions extends Record<string, unknown> {
  colors?: boolean
  depth?: number | null
  hideDate?: boolean
  showHidden?: boolean
}

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */
export interface Formatters {
  [formatter: string]: (this: Debugger, value: unknown) => string
}

export interface Debugger extends Required<DebugOptions> {
  (formatter: unknown, ...args: unknown[]): void

  namespace: string
  enabled: boolean

  extend: (namespace: string, delimiter?: string) => Debugger
}

export interface DebugOptions {
  useColors?: boolean
  color?: number

  formatArgs?: (this: Debugger, diff: number, args: unknown[]) => void
  formatters?: Formatters
  /** Node.js only */
  inspectOpts?: InspectOptions
  /** Humanize a duration in milliseconds */
  humanize?: (value: number) => string

  log?: (this: Debugger, ...args: unknown[]) => void
}
