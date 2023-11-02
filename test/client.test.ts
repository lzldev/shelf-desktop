import * as mnet from '@tensorflow-models/mobilenet'
import * as tsmain from '@tensorflow/tfjs-node'
import {ShelfClient} from '../src/main/shelf-client/ShelfClient'
import {vi, beforeAll, test, expect, isFirstRun} from 'vitest'
import {IpcRendererEvents} from '../src/preload/ipcRendererTypes'
import '../src/main/index.ts'
import '../src/main/shelf-client/index'
import { __MOCK_ELECTRON } from '../__mocks__/electron'

let TestClient: ShelfClient

vi.mock('electron')
vi.mock('@electron-toolkit/preload')
vi.mock('@electron-toolkit/utils')

vi.mock('../src/main/index.ts', () => ({
  sendEventAfter: (
    events: (keyof IpcRendererEvents)[],
    func: (...any: any[]) => any,
  ) => {
    return func;
    return (...args: any[]) => {
      const result = func.call(undefined, ...args)
      return result
    }
  },
  requestClient: () => {
    return TestClient
  },
}))

beforeAll(async () => {
  if (!isFirstRun) {
    return
  }

  console.log(`VERSIONS`)
  console.log(`NODE: ${process.version}`)
  console.log(`NODE_MODULE:${process.versions.modules}`)
  console.log(`TENSORFLOW:${tsmain.version}`)
  console.log(`MNET:${mnet.version}`)

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

test('Shelf Client', async () => {
  expect(TestClient.ready, 'Is Client Ready').toBe(true)

  expect(
    TestClient.getWatchedFiles(),
    'Are the Watched Files Returning',
  ).toBeTypeOf('object')

  const {ipcMain} = (await import('electron')) as unknown as __MOCK_ELECTRON

  const result = await ipcMain.invoke('getShelfContent', {
    pagination: {
      offset: 10,
      limit: 10,
    },
    query: [],
    order: ['id', 'DESC'],
  })

  expect(result.content,"Content Request").toBeInstanceOf(Array)
})
