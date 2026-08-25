import {createDebug} from '@sanity/debug'

const messages: unknown[][] = []
const log = createDebug('bun', {
  color: 200,
  log: (...args: unknown[]) => messages.push(args),
  useColors: true,
})
log.enabled = true
log('hello')

if (!log.useColors) {
  throw new Error('Expected the Bun export to support colors')
}

const message = String(messages[0]?.[0])
if (!message.includes('\u001B[')) {
  throw new Error(`Expected ANSI-formatted debug output, got: ${message}`)
}
