import {defineConfig} from '@sanity/tsdown-config'
import {mergeConfig, type UserConfig} from 'tsdown'

const config = await defineConfig({
  entry: ['./src/{default,node}.ts'],
  exports: {
    devExports: false,
    customExports(exports) {
      const defaultEntry = exports['./default']
      const nodeEntry = exports['./node']

      if (!defaultEntry || !nodeEntry) {
        throw new Error('Expected default and node build entries')
      }

      delete exports['./default']
      delete exports['./node']

      exports['.'] = {
        'browser': defaultEntry,
        'react-server': defaultEntry,
        'deno': nodeEntry,
        'workerd': defaultEntry,
        'worker': defaultEntry,
        'bun': nodeEntry,
        'node': nodeEntry,
        'default': defaultEntry,
      }
      exports['./package.json'] = './package.json'

      return exports
    },
  },
  tsconfig: './tsconfig.dist.json',
})

export default mergeConfig(config, {
  plugins: [
    {
      name: 'type-only-chunk-js-stubs',
      generateBundle: {
        order: 'post',
        handler(_options, bundle) {
          for (const fileName of Object.keys(bundle)) {
            if (!fileName.endsWith('.d.ts')) continue

            const jsFileName = `${fileName.slice(0, -'.d.ts'.length)}.js`
            if (jsFileName in bundle) continue

            const declarationName = fileName.slice(fileName.lastIndexOf('/') + 1)
            this.emitFile({
              type: 'asset',
              fileName: jsFileName,
              source: `// @ts-self-types="./${declarationName}"\nexport {}\n`,
            })
          }
        },
      },
    },
  ],
}) satisfies UserConfig
