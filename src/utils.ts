/**
 * Coerce `value`.
 */
export function coerce(value: unknown): unknown {
  if (value instanceof Error) {
    if (!value.stack) return value.message
    return value.stack.includes(value.message) ? value.stack : `${value.message}\n${value.stack}`
  }
  return value
}

/**
 * Selects a color for a debug namespace
 * @return An ANSI color code for the given namespace
 */
export function selectColor<Color extends string | number>(
  colors: Color[],
  namespace: string,
): Color {
  let hash = 0

  for (let i = 0; i < namespace.length; i++) {
    hash = (hash << 5) - hash + namespace.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }

  return colors[Math.abs(hash) % colors.length]
}

/**
 * Checks if the given string matches a namespace template, honoring
 * asterisks as wildcards.
 */
export function matchesTemplate(search: string, template: string): boolean {
  let searchIndex = 0
  let templateIndex = 0
  let starIndex = -1
  let matchIndex = 0

  while (searchIndex < search.length) {
    if (
      templateIndex < template.length &&
      (template[templateIndex] === search[searchIndex] || template[templateIndex] === '*')
    ) {
      // Match character or proceed with wildcard
      if (template[templateIndex] === '*') {
        starIndex = templateIndex
        matchIndex = searchIndex
        templateIndex++ // Skip the '*'
      } else {
        searchIndex++
        templateIndex++
      }
    } else if (starIndex !== -1) {
      // Backtrack to the last '*' and try to match more characters
      templateIndex = starIndex + 1
      matchIndex++
      searchIndex = matchIndex
    } else {
      return false // No match
    }
  }

  // Handle trailing '*' in template
  while (templateIndex < template.length && template[templateIndex] === '*') {
    templateIndex++
  }

  return templateIndex === template.length
}

export function humanize(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`
  return `${value}ms`
}
