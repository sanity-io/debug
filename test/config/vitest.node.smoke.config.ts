import {defineConfig} from 'vitest/config'

import {builtPackageAlias, nodeSmokeConfig} from '../../vitest.config.js'

export default defineConfig({
  test: {
    ...nodeSmokeConfig,
    alias: builtPackageAlias('./dist/node.js'),
  },
})
