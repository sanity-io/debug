import {playwright} from '@vitest/browser-playwright'
import {defineConfig} from 'vitest/config'

import {builtPackageAlias, smokeConfig} from '../../vitest.config.js'

export default defineConfig({
  test: {
    ...smokeConfig,
    alias: builtPackageAlias('./dist/default.js'),
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        {browser: 'chromium', headless: true},
        {browser: 'firefox', headless: true},
        {browser: 'webkit', headless: true},
      ],
    },
  },
})
