import {defineConfig} from 'vitest/config'
import {externalizeDepsPlugin} from 'electron-vite'

export default defineConfig({
  plugins: [externalizeDepsPlugin()],
})
