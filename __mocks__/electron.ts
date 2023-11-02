import type {ShelfIpcRendererInvoke} from '../src/preload/ipcMainTypes'

class Tray {
  constructor(image: any) {
    console.log(`Creating Tray with ${image}`)
  }

  setContextMenu(menu: Menu) {
    console.log(`Setting Context Menu`)
  }
}
class Menu {
  static buildFromTemplate(template: any) {
    console.log(`Building Menu From Template`)
  }
  constructor(image: any) {
    console.log(`Creating Menu`)
  }
}

class BrowserWindow {
  webContents = {
    setWindowOpenHandler: (handler: Function) => {
      console.log(`Setting Window Open Handler`)
    },
  }

  constructor(config: any) {
    console.log(`Window Config ${config}`)
  }
  on(event: string, _: Function) {
    console.log(`Setting Window Handler for event ${event}`)
  }
  loadFile(file: string) {
    console.log(`Window Loading File ${file}`)
  }
  loadURL(file: string) {
    console.log(`Window Loading URL ${file}`)
  }

  static getFocusedWindow() {
    return {
      getPosition: () => [960, 540],
    }
  }
}

const app = {
  getPath: (_: string) => {
    return './examples/app/'
  },
  on: (method: Function) => {
    console.log(`FAKE ELECTRON Registered Handler for :${method.name}`)
  },
  whenReady: () => {
    return new Promise((res, _) => {
      res(true)
    })
  },
  isPackaged: false,
}

const ipcMain = {
  handlers: {},
  handle: (event: string, handler: Function) => {
    console.log(`${event} HANDLER REGISTRED -----------------`)
    ipcMain.handlers[event] = handler
  },
  on: (event: string, method: Function) => {
    console.log(`FAKE ELECTRON Registered Handler for :${method.name}`)
  },
  invoke: ((event, ...params) => {
    if (!(event in ipcMain.handlers)) {
      console.log(`${event} not registered`)
    }

    const handler = ipcMain.handlers[event as any]

    if (Array.isArray(params)) {
      return handler.call(undefined, event, ...params)
    } else {
      return handler.call(undefined, event, params)
    }
  }) as ShelfIpcRendererInvoke,
} as {
    handlers:any,
    invoke:ShelfIpcRendererInvoke
  }

const nativeImage = {
  createFromPath: (path: string) => {
    console.log(`Creating Image from path ${path}`)
  },
}

const screen = {
  getPrimaryDisplay: () => {
    return {
      bounds: [1920, 1080],
    }
  },
}

const __MOCK_ELECTRON = {
  app,
  ipcMain,
  Tray,
  nativeImage,
  Menu,
  screen,
  BrowserWindow,
}

export type __MOCK_ELECTRON = typeof __MOCK_ELECTRON

module.exports = {...__MOCK_ELECTRON}
