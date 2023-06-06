import * as chokidar from 'chokidar'
import {__DBEXTENSION, createShelfDB, ShelfDBModels} from '../db/ShelfDB'
import {addChokiEvents} from './ChokiEvents'
import {FSWatcher} from 'chokidar'
import {zJson, zJsonSchemaInfer} from '../zJson'
import {join} from 'path'
import {
  CLIENT_CONFIG_FILE_NAME,
  SHELF_CLIENT_CONFIG_SCHEMA,
  ShelfClientConfig,
  ShelfClientConfigValues,
} from '../ShelfConfig'
import {globSupportedFormats} from '../../../renderer/src/utils/formats'

class ShelfClient {
  private _choki: FSWatcher
  private _ShelfDB: ShelfDBModels
  private _ready = false
  private _config: zJson<
    typeof SHELF_CLIENT_CONFIG_SCHEMA,
    ShelfClientConfigValues
  >

  get config() {
    return this._config
  }
  get models() {
    return this._ShelfDB
  }
  get choki() {
    return this._choki
  }
  get ready() {
    return this._ready
  }
  set ready(value) {
    this._ready = value
  }
  static async create(basePath: string, callback: () => void) {
    const ShelfDB = await createShelfDB(
      Array.isArray(basePath) ? basePath[0] : basePath,
    )
    const config = new zJson(
      join(basePath + CLIENT_CONFIG_FILE_NAME),
      SHELF_CLIENT_CONFIG_SCHEMA,
      {
        additionalPaths: [],
        ignoredPaths: [],
        ignoreHidden: true,
        ignoreUnsupported: true,
      },
    )

    const choki = chokidar.watch([basePath, ...config.get('additionalPaths')], {
      ignored: [
        ...config.get('ignoredPaths'),
        config.get('ignoreHidden') ? '**/.**' : '',
        config.get('ignoreUnsupported') ? globSupportedFormats : '',
        `**/**.${__DBEXTENSION}`,
      ],
      followSymlinks: false,
    })

    return new ShelfClient({
      choki,
      ShelfDB,
      callback,
      config,
    })
  }
  protected constructor(newInstance: {
    choki: FSWatcher
    ShelfDB: ShelfDBModels
    config: zJson<typeof SHELF_CLIENT_CONFIG_SCHEMA, ShelfClientConfigValues>
    callback: () => void
  }) {
    this._ShelfDB = newInstance.ShelfDB
    this._choki = newInstance.choki
    this._config = newInstance.config

    addChokiEvents(this, newInstance.callback)

    return this
  }

  getWatchedFiles() {
    return this._choki.getWatched()
  }
}

export {ShelfClient}
