import {defineConfig} from 'vitest/config'

import {nonNodeConfig} from '../../vitest.config.js'

export default defineConfig({
  test: {
    ...nonNodeConfig,
    environment: 'jsdom',
  },
})
