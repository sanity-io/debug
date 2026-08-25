import {defineConfig} from 'vitest/config'

import {sharedConfig} from '../../vitest.config.js'

export default defineConfig({
  test: sharedConfig,
})
