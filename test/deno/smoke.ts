import {createDebug} from '@sanity/debug'

Deno.test('the built package loads with Node.js color support in Deno', () => {
  const messages: unknown[][] = []
  const log = createDebug('deno', {
    color: 200,
    log: (...args: unknown[]) => messages.push(args),
    useColors: true,
  })
  log.enabled = true
  log('hello')

  if (!log.useColors) {
    throw new Error('Expected the Deno export to support colors')
  }

  const message = String(messages[0]?.[0])
  if (!message.includes('\u001B[')) {
    throw new Error(`Expected ANSI-formatted debug output, got: ${message}`)
  }
})
