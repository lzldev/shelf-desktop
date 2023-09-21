// electron.vite.config.ts
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import million from "million/compiler";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@models": resolve("src/main/src/db/models")
      }
    },
    plugins: [react(), svgr(), million.vite({ auto: true })]
  }
});
export {
  electron_vite_config_default as default
};
