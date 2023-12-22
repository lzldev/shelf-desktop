import * as chokidar from 'chokidar'
import {ShelfDBConnection} from '../db/ShelfControllers'
import {addChokiEvents} from './ChokiEvents'
import {FSWatcher} from 'chokidar'
import {zJson} from '../zJson'
import {join} from 'path'

import {
  CLIENT_CONFIG_FILE_NAME,
  SHELF_CLIENT_CONFIG_SCHEMA,
  SHELF_THUMB_DEFFAULT_PATH,
  ShelfClientConfigValues,
} from '../ShelfConfig'

import {globSupportedFormats} from '../../renderer/src/utils/Extensions'
import {IpcMainEvents} from '../../preload/ipcMainTypes'

import CreateAIWorker from './ai_worker/worker?nodeWorker'
import type {AIWORKERTYPE as AiWorkerType} from './ai_worker/types'

import CreateThumbWorker from './thumbworker/worker?nodeWorker'
import {ThumbWorkerData, ThumbWorkerType} from './thumbworker/types'

import {SHARE_ENV} from 'worker_threads'
import {__DBEXTENSION, createShelfKyselyDB} from '../db/ShelfKyselyDB'

class ShelfClient {
  public choki: FSWatcher
  public ShelfDB: ShelfDBConnection
  public AiWorker: AiWorkerType
  public ThumbWorker: ThumbWorkerType

  public ready = false

  public config: zJson<
    typeof SHELF_CLIENT_CONFIG_SCHEMA,
    ShelfClientConfigValues
  >

  static async create(
    options: IpcMainEvents['startShelfClient']['args'][0],
    callback: () => void,
  ) {
    const ShelfDB = createShelfKyselyDB(options.basePath)

    const config = new zJson(
      join(options.basePath + CLIENT_CONFIG_FILE_NAME),
      SHELF_CLIENT_CONFIG_SCHEMA,
      {
        additionalPaths: [],
        ignoredPaths: [],
        ignoreHidden: true,
        ignoreUnsupported: true,
        aiWorker: true,
        ...(options.config ? options.config : {}),
      },
    )

    const choki = chokidar.watch(
      [options.basePath, ...config.get('additionalPaths')],
      {
        ignored: [
          ...config.get('ignoredPaths'),
          config.get('ignoreUnsupported') ? globSupportedFormats : '',
          `**/**.${__DBEXTENSION}`,
        ],
        followSymlinks: false,
      },
    )

    let aiWorker: AiWorkerType

    if (!import.meta.env.VITEST && config.get('aiWorker')) {
      aiWorker = CreateAIWorker({
        env: SHARE_ENV,
        workerData: {dbPath: options.basePath},
      }) as AiWorkerType
    } else {
      aiWorker = {
        postMessage: () => {},
        on: () => {},
      } as any as AiWorkerType
    }

    let thumbWorker: ThumbWorkerType

    if (!import.meta.env.VITEST) {
      thumbWorker = CreateThumbWorker({
        env: SHARE_ENV,
        workerData: {
          thumbnailPath: SHELF_THUMB_DEFFAULT_PATH,
        } satisfies ThumbWorkerData,
      }) as ThumbWorkerType
    } else {
      thumbWorker = {
        postMessage: () => {},
        on: () => {},
      } as any as ThumbWorkerType
    }

    return new ShelfClient({
      aiWorker,
      thumbWorker,
      choki,
      ShelfDB,
      callback,
      config,
    })
  }

  protected constructor(newInstance: {
    aiWorker: AiWorkerType
    thumbWorker: ThumbWorkerType
    choki: FSWatcher
    ShelfDB: ShelfDBConnection
    config: zJson<typeof SHELF_CLIENT_CONFIG_SCHEMA, ShelfClientConfigValues>
    callback: () => void
  }) {
    this.AiWorker = newInstance.aiWorker
    this.ThumbWorker = newInstance.thumbWorker
    this.ShelfDB = newInstance.ShelfDB
    this.choki = newInstance.choki
    this.config = newInstance.config

    this.config.save()

    addChokiEvents(this, () => {
      this.ready = true

      newInstance.callback()
    })

    return this
  }

  async destroy() {
    await this.ShelfDB.destroy()
    await this.choki.close()
  }

  getWatchedFiles() {
    return this.choki.getWatched()
  }
}

export {ShelfClient}
