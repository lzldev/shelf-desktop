import {vi, beforeAll, test, expect} from 'vitest'

import * as tsmain from '@tensorflow/tfjs-node'
import * as mnet from '@tensorflow-models/mobilenet'

import {ShelfClient} from '../src/main/shelf-client/ShelfClient'

vi.mock( "./src/main/shelf-client/thumbworker/worker", () => {
  return () => {
    return {
      postMessage:(message:any) => {
        console.log(`Worker Received a message ${JSON.stringify(message)}`)
      }
    }
  }
})

vi.mock("./src/main/shelf-client/ai_worker/worker", () => {
  return () => {
    return {
      postMessage:(message:any) => {
        console.log(`Worker Received a message ${JSON.stringify(message)}`)
      }
    }
  }
})

vi.mock('@electron-toolkit/preload', () => {
  console.log('toolkit')
  const app = {
    getPath: (_: string) => {
      return './examples/app/'
    },
    isPackaged: false,
  }
  return {app}
})

vi.mock('@electron-toolkit/utils', () => {
  const electronApp = {
    setAppUserModelId: (name: string) => {
      console.log(`APP NAME SET ${name}`)
    },
  }

  const is = {
    dev: true,
  }

  const optmizer = {
    watchWindowShortcuts: (window) => {
      console.log(`Watching for window shortcuts.`)
    },
  }
  return {electronApp, is, optmizer}
})

vi.mock('../src/main/shelf-client/index.ts', () => {
  return {
    sendEventAfter: () => {},
  }
})
vi.mock('electron', async () => {
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

  return {app, ipcMain, Tray, nativeImage, Menu, screen, BrowserWindow}
})

let TestClient: ShelfClient

beforeAll(async () => {
  console.log(`VERSIONS`)
  console.log(`NODE: ${process.version}`)
  console.log(`TENSORFLOW:${tsmain.version}`)
  console.log(`MNET:${mnet.version}`)
  console.log(`NODE:VERSIONS:${JSON.stringify(process.versions)}`)
  console.log(`Location ${import.meta}`)

  return new Promise(async (resolve, rej) => {
    TestClient = await ShelfClient.create(
      {
        basePath: './examples/',
      },
      () => {
        resolve()
      },
    )
  })
})

test('Shelf Client', () => {
  expect(TestClient.ready, 'Is Client Ready').toBe(true)
  expect(TestClient.getWatchedFiles(), 'Are the Watched Files Returning').toBeTypeOf(
    'object'
  )
})
