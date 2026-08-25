# @sanity/debug

`@sanity/debug` is a small debug logger for Node.js, Deno, Bun, browsers, workers, and edge runtimes. It is a fork of [`obug`](https://github.com/sxzz/obug), which itself is a fork of [debug](https://github.com/debug-js/debug).

The goal of this fork is to be compatible with all the environments/runtimes that our Sanity modules support, while maintaining a small footprint.

## Install

```sh
npm install @sanity/debug
```

## Use the logger

```ts
import {createDebug, enable} from '@sanity/debug'

enable('app:*')

const debug = createDebug('app:request')
debug('received request %j', {method: 'GET', path: '/health'})
```

Node.js, Deno, and Bun load the Node.js entry. This entry writes to `stderr` and supports ANSI colors.

Browsers, workers, edge runtimes, and React Server Components load the default entry. This entry does not add CSS or ANSI color codes. The `color` and `useColors` options have no effect there.

## Enable namespaces

In Node.js, Deno, or Bun, set the `DEBUG` environment variable:

```sh
DEBUG=app:* node server.js
```

In a browser, set `localStorage.debug` and reload the page:

```js
localStorage.debug = 'app:*'
```

Use `*` as a wildcard. Prefix a namespace with `-` to exclude it:

```sh
DEBUG='app:*,-app:health' node server.js
```

You can also change the active namespaces at runtime:

```ts
import {disable, enable, enabled, namespaces} from '@sanity/debug'

enable('app:*')
enabled('app:request') // true
namespaces() // 'app:*'

const previous = disable()
enable(previous)
```

## Extend a namespace

```ts
import {createDebug} from '@sanity/debug'

const debug = createDebug('app')
const requestDebug = debug.extend('request')

requestDebug.namespace // 'app:request'
```

The child logger keeps the parent logger's output and formatting options.

## Configure a logger

Pass options to `createDebug()` to change one logger:

```ts
import {createDebug} from '@sanity/debug'

const debug = createDebug('app:request', {
  log: console.log,
  humanize: (milliseconds) => `${milliseconds}ms`,
  formatters: {
    u: (value) => String(value).toUpperCase(),
  },
})

debug.enabled = true
debug('request ID: %u', 'abc')
```

The Node.js entry also supports these options:

- `useColors` enables or disables ANSI colors.
- `color` sets the ANSI color number for the namespace.
- `inspectOpts` sets options for `node:util` inspection and formatting.

The `DEBUG_COLORS`, `DEBUG_DEPTH`, `DEBUG_HIDE_DATE`, and `DEBUG_SHOW_HIDDEN` environment variables set the related Node.js inspection options.

## License and acknowledgements

This project includes work from [`obug`](https://github.com/sxzz/obug) and [`debug`](https://github.com/debug-js/debug). See [LICENSE](./LICENSE) for the copyright notices and MIT license.
