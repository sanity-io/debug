---
'@sanity/debug': major
---

Publish `@sanity/debug`, a fork of `obug` for the runtime matrix supported by Sanity packages. The fork keeps the familiar debugging API while avoiding color-formatting code in runtimes that cannot use it.

Compared with `obug`:

- Install and import `@sanity/debug` instead of `obug`.
- Node.js 22.12 or newer is required. Deno and Bun use the Node.js entry, including `node:util` formatting and ANSI colors.
- Browsers, workers, edge runtimes, and React Server Components use the `default` entry. This entry never emits CSS or ANSI color codes. It ignores the `color` and `useColors` options.
- The package uses conditional ESM exports. CommonJS, JSR, and CDN-specific entry points are not published.

This runtime split lets Sanity modules use one small debugging package across their supported environments.
