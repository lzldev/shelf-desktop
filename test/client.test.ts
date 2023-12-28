import {ShelfClient} from '../src/main/shelf-client/ShelfClient'
import {
  vi,
  beforeAll,
  test,
  expect,
  describe,
  expectTypeOf,
  afterAll,
} from 'vitest'
import {IpcRendererEvents} from '../src/preload/ipcRendererTypes'
import '../src/main/index.ts'
import '../src/main/shelf-client/index'
import {__MOCK_ELECTRON} from '../__mocks__/electron'
import {clearTempDir, tempTestPath} from './utils'

vi.mock('electron')
vi.mock('@electron-toolkit/preload')
vi.mock('@electron-toolkit/utils')

vi.mock('../src/main/index.ts', () => ({
  sendEventAfter: (
    events: (keyof IpcRendererEvents)[],
    func: (...any: any[]) => any,
  ) => {
    return func
  },
  requestClient: () => {
    return TestClient
  },
}))

const electron = (await import('electron')) as unknown as __MOCK_ELECTRON

let TestClient: ShelfClient

describe('Shelf Client', () => {
  beforeAll(async () => {
    await clearTempDir()

    if (TestClient) {
      return
    }

    console.log(`VERSIONS`)
    console.log(`NODE: ${process.version}`)
    console.log(`NODE_MODULE:${process.versions.modules}`)

    await new Promise<void>((resolve) => {
      ShelfClient.create(
        {
          basePath: tempTestPath,
        },
        (client: ShelfClient) => {
          TestClient = client
          resolve()
        },
      )
    })
  })

  afterAll(async () => {
    console.log('end')
    clearTempDir()
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

    console.log(result)

    expect(result.content, 'Content Request').toBeInstanceOf(Array)
  })

  test('Tag Handler', async () => {
    const tags = await electron.ipcMain.invoke('getShelfTags')

    expect(tags, 'Tag Request').toBeInstanceOf(Array)

    expectTypeOf(tags.at(0)!).toMatchTypeOf<{
      name: string
    }>()
  })
})
