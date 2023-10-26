/// <reference types="electron-vite/node" />
/// <reference types="electron/types" />

interface ImportMetaEnv {
  readonly MAIN_VITE_WORKER_LOGGING: string
  readonly MAIN_VITE_MAIN_LOGGING: string
  readonly MAIN_VITE_NO_UI: string
  readonly MAIN_VITE_NO_UI_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
