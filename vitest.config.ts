import {defineConfig, mergeConfig} from 'vitest/config'
import viteConfig from './electron.vite.config'

export default mergeConfig(
  //@ts-expect-error - viteConfig is not typed
  viteConfig.main,
  defineConfig({
    test: {
      isolate: false,
      watch: false,
    },
  }),
)
