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
  handle: (method: Function) => {
    console.log(`FAKE ELECTRON Registered Handler for :${method.name}`)
  },
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

export {app, ipcMain, Tray, nativeImage, Menu, screen, BrowserWindow}
