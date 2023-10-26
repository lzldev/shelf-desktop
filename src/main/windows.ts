export const WindowOptions = {
  main: {
    route: 'main',
    startOptions: {
      x: 1024,
      y: 850,
      width: 600,
      height: 400,
      minWidth: 600,
      minHeight: 400,
    },
  },
  start: {
    route: 'start',
    startOptions: {
      width: 472,
      height: 500,
      minWidth: 472,
      minHeight: 400,
    },
  },
  progress: {
    route: 'progress',
    startOptions: {
      width: 600,
      height: 250,
      resizable: false,
    },
  },
} as const satisfies ccc

type ccc = Record<
  string,
  {
    route: string
    startOptions: Electron.BrowserWindowConstructorOptions
  }
>

export type ShelfWindowOptions = typeof WindowOptions
export type ShelfWindowID = keyof typeof WindowOptions
