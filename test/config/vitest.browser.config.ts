import {playwright} from '@vitest/browser-playwright'
import {defineConfig} from 'vitest/config'

import {nonNodeConfig} from '../../vitest.config.js'

export default defineConfig({
  test: {
    ...nonNodeConfig,
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
