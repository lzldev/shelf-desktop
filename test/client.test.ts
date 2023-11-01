import * as mnet from '@tensorflow-models/mobilenet'
import * as tsmain from '@tensorflow/tfjs-node'
import {ShelfClient} from '../src/main/shelf-client/ShelfClient'
import {vi, beforeAll, test, expect} from 'vitest'

vi.mock('../src/main/shelf-client/index.ts', () => {
  return {
    sendEventAfter: (event:string,func:Function) => {
      console.log(`registering event_${event}`)
    },
  }
})

vi.mock('electron')
vi.mock('@electron-toolkit/preload')
vi.mock('@electron-toolkit/utils')

let TestClient: ShelfClient

beforeAll(async () => {
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

test('Shelf Client', () => {
  expect(TestClient.ready, 'Is Client Ready').toBe(true)
  expect(TestClient.getWatchedFiles(), 'Are the Watched Files Returning').toBeTypeOf(
    'object'
  )
})
