import {configDefaults, defineConfig, type ViteUserConfig} from 'vitest/config'

export const baseExclude = [
  ...configDefaults.exclude,
  'test/config/**',
  'test/deno/**',
  'test/smoke/**',
]

export const nonNodeExclude = [...baseExclude, 'test/*.node.test.ts']

const ciReporters = process.env['GITHUB_ACTIONS'] ? {reporters: ['default', 'github-actions']} : {}

export const sourceNodeAlias = {
  '@sanity/debug': new URL('./src/node.ts', import.meta.url).pathname,
}

export const sourceDefaultAlias = {
  '@sanity/debug': new URL('./src/default.ts', import.meta.url).pathname,
}

export const sharedConfig = {
  alias: sourceNodeAlias,
  exclude: baseExclude,
  ...ciReporters,
  unstubEnvs: true,
  unstubGlobals: true,
} satisfies ViteUserConfig['test']

export const nonNodeConfig = {
  ...sharedConfig,
  alias: sourceDefaultAlias,
  exclude: nonNodeExclude,
} satisfies ViteUserConfig['test']

export const smokeConfig = {
  include: ['test/smoke/default.test.ts'],
  ...ciReporters,
} satisfies ViteUserConfig['test']

export const nodeSmokeConfig = {
  include: ['test/smoke/node.test.ts'],
  ...ciReporters,
} satisfies ViteUserConfig['test']

export function builtPackageAlias(main: './dist/default.js' | './dist/node.js') {
  return {
    '@sanity/debug': new URL(main, import.meta.url).pathname,
  }
}

export default defineConfig({
  test: sharedConfig,
})
