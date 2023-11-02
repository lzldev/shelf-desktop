import {defineConfig} from 'vitest/config'
import {externalizeDepsPlugin} from 'electron-vite'

export default defineConfig({
  test:{
    isolate:false,
  },
  plugins: [externalizeDepsPlugin()],
})
