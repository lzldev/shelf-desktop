import electron from 'electron'

export const SHELF_IS_DEVELOPMENT =
  'ELECTRON_IS_DEV' in process.env
    ? Number.parseInt(process.env.ELECTRON_IS_DEV || '') === 1
    : !electron?.app?.isPackaged
