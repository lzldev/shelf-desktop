import * as mnet from '@tensorflow-models/mobilenet'
import * as tsmain from '@tensorflow/tfjs-node'
import {ShelfClient} from '../src/main/shelf-client/ShelfClient'
import {
  vi,
  beforeAll,
  test,
  expect,
  isFirstRun,
  describe,
  expectTypeOf,
  assert,
} from 'vitest'
import {IpcRendererEvents} from '../src/preload/ipcRendererTypes'
import '../src/main/index.ts'
import '../src/main/shelf-client/index'
import {__MOCK_ELECTRON} from '../__mocks__/electron'

vi.mock('electron')
vi.mock('@electron-toolkit/preload')
vi.mock('@electron-toolkit/utils')

vi.mock('../src/main/index.ts', () => ({
  sendEventAfter: (
    events: (keyof IpcRendererEvents)[],
    func: (...any: any[]) => any,
  ) => {
    return func
    return (...args: any[]) => {
      const result = func.call(undefined, ...args)
      return result
    }
  },
  requestClient: () => {
    return TestClient
  },
}))

const electron = (await import('electron')) as unknown as __MOCK_ELECTRON

let TestClient: ShelfClient

describe('Shelf Client', () => {
  beforeAll(async () => {
    if (TestClient) {
      return
    }

    console.log(`VERSIONS`)
    console.log(`NODE: ${process.version}`)
    console.log(`NODE_MODULE:${process.versions.modules}`)
    console.log(`TENSORFLOW:${tsmain.version}`)
    console.log(`MNET:${mnet.version}`)

    await new Promise<void>((resolve, rej) => {
      const test = ShelfClient.create(
        {
          basePath: './examples/',
        },
        () => {
          TestClient = test as unknown as ShelfClient
          resolve()
        },
      )
    })
  })

  test('Choki Watched Files', async () => {
    expect(TestClient.ready, 'Is Client Ready').toBe(true)

    expect(
      TestClient.getWatchedFiles(),
      'Are the Watched Files Returning',
    ).toBeTypeOf('object')
  })

  test('Content Handler', async () => {
    const result = await electron.ipcMain.invoke('getShelfContent', {
      pagination: {
        offset: 10,
        limit: 10,
      },
      query: [],
      order: ['id', 'DESC'],
    })

    expect(result.content, 'Content Request').toBeInstanceOf(Array)
  })

  test('Content Details Handler', async () => {
    const result = await electron.ipcMain.invoke('getDetailedContent', 1)

    if (result === null) {
      throw 'Content Not found'
    }

    assert(result)
    expect(result).toBeTruthy()
    expect(result).toBeTypeOf('object')
    expect(result.paths).toBeInstanceOf(Array)

    expect(result).toMatchObject({
      id: expect.any(Number),
      createdAt: expect.any(String),
      hash: expect.any(String),
      extension: expect.any(String),
    })

    expectTypeOf(result).toMatchTypeOf<{
      hash: string
      extension: string
      paths?: {path: string}[]
      tags?: {name: string}[]
    }>()
  })

  test('Tag Handler', async () => {
    const tags = await electron.ipcMain.invoke('getShelfTags')

    expect(tags, 'Tag Request').toBeInstanceOf(Array)

    expectTypeOf(tags.at(0)!).toMatchTypeOf<{
      name: string
    }>()
  })
})
