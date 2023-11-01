import * as chokidar from 'chokidar'
import {__DBEXTENSION, createShelfDB, ShelfDBModels} from '../db/ShelfDB'
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

import * as os from 'node:os'
import {SHELF_LOGGER} from '../utils/Loggers'
import {SHARE_ENV} from 'worker_threads'

class ShelfClient {
  public choki: FSWatcher
  public ShelfDB: ShelfDBModels
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
    const ShelfDB = await createShelfDB(options.basePath)

    const config = new zJson(
      join(options.basePath + CLIENT_CONFIG_FILE_NAME),
      SHELF_CLIENT_CONFIG_SCHEMA,
      {
        additionalPaths: [],
        ignoredPaths: [],
        ignoreHidden: true,
        ignoreUnsupported: true,
        ai_worker: false,
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

    if (!import.meta.env.VITEST && config.get('ai_worker')) {
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

    const max_threads = os.cpus().length
    SHELF_LOGGER.info(`max_threads ${max_threads}`)

    let thumbWorker: ThumbWorkerType

    if (!import.meta.env.VITEST) {
      thumbWorker = CreateThumbWorker({
        env: SHARE_ENV,
        workerData: {
          max_threads: max_threads <= 0 ? 2 : max_threads,
          thumbnailPath: SHELF_THUMB_DEFFAULT_PATH,
        } as ThumbWorkerData,
      }) as ThumbWorkerType
    }else {
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
    ShelfDB: ShelfDBModels
    config: zJson<typeof SHELF_CLIENT_CONFIG_SCHEMA, ShelfClientConfigValues>
    callback: () => void
  }) {
    this.AiWorker = newInstance.aiWorker
    this.ThumbWorker = newInstance.thumbWorker
    this.ShelfDB = newInstance.ShelfDB
    this.choki = newInstance.choki
    this.config = newInstance.config

    this.config.save()

    addChokiEvents(this, newInstance.callback)

    return this
  }

  async destroy() {
    await this.ShelfDB.sequelize.close()
    await this.choki.close()
  }

  getWatchedFiles() {
    return this.choki.getWatched()
  }
}

export {ShelfClient}
