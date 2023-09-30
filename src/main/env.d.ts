/// <reference types="electron-vite/node" />

interface ImportMetaEnv {
  readonly MAIN_VITE_SOME_KEY: string
  readonly MAIN_VITE_NO_UI: string
  readonly MAIN_VITE_NO_UI_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
