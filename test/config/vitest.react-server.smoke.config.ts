import {defineConfig} from 'vitest/config'

import {builtPackageAlias, smokeConfig} from '../../vitest.config.js'

export default defineConfig({
  test: {
    ...smokeConfig,
    alias: builtPackageAlias('./dist/default.js'),
  },
  resolve: {
    conditions: ['react-server', 'browser', 'module', 'import'],
  },
})
