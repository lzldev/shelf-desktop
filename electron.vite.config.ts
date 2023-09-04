import {resolve} from 'path'
import {defineConfig, externalizeDepsPlugin} from 'electron-vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import million from 'million/compiler'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@models': resolve('src/main/src/db/models'),
      },
    },
    plugins: [react(), svgr(), million.vite({auto: true})],
  },
})
