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
import {TestContent, clearTempDir, tempTestPath} from './utils'
import {ContentDetails, ListContent} from '../src/main/db/ContentControllers'
import {rm} from 'fs/promises'

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
let fileToBeRemoved: string

describe('Start Shelf Client', () => {
  beforeAll(async () => {
    await clearTempDir()
    if (TestClient) {
      return
    }

    console.log(`VERSIONS`)
    console.log(`NODE: ${process.version}`)
    console.log(`NODE_MODULE:${process.versions.modules}`)

    //Start Client
    await new Promise<void>((res, rej) => {
      ShelfClient.create(
        {
          basePath: tempTestPath,
        },
        (client: ShelfClient) => {
          TestClient = client
          res()
        },
      ).catch(rej)
    })
  })

  test('Write 2 Files into Temp Dir', async () => {
    await TestContent.at(1)?.copytoTemp('image1.png')
    await TestContent.at(1)?.copytoTemp('image2.png')
    fileToBeRemoved = await TestContent.at(1)!.copytoTemp('image3.png')!

    await TestContent.at(2)?.copytoTemp('image4.png')

    //Wait for Events
    await new Promise((res) => setTimeout(res, 100))

    const files = await ListContent(TestClient.ShelfDB, {
      pagination: {
        offset: 0,
        limit: 10,
      },
      query: [],
    })

    console.log(files.content)
    expect(files.content).toBeInstanceOf(Array)
  })

  test('Detailed 2', async () => {
    const f = await ContentDetails(TestClient.ShelfDB, 1)

    expect(f).toBeTypeOf('object')
    if (!f) return
    expect(f.paths).toBeInstanceOf(Array)
    expect(f.paths.length).toBe(3)
  })
})

describe('OnReady cleanup 1 Path', () => {
  test('Destroy Client', async () => {
    await TestClient.destroy()
  })

  test('Remove one file', async () => {
    await rm(fileToBeRemoved)
  })

  test('Restart Client', async () => {
    await new Promise<void>((res, rej) => {
      ShelfClient.create(
        {
          basePath: tempTestPath,
        },
        (client: ShelfClient) => {
          TestClient = client
          res()
        },
      ).catch(rej)
    })
  })

  test('Check Paths', async () => {
    const f = await ContentDetails(TestClient.ShelfDB, 1)

    expect(f).toBeTypeOf('object')
    if (!f) return

    expect(f.paths).toBeInstanceOf(Array)
    expect(f.paths.length).toBe(2)
  })
})
