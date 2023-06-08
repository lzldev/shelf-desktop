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
import {IpcMainEvents} from '../../../preload/ipcMainTypes'

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
  static async create(
    options: IpcMainEvents['startShelfClient']['args'][0],
    callback: () => void,
  ) {
    console.log('options ->', options)
    const ShelfDB = await createShelfDB(options.basePath)
    const objthing = {
      additionalPaths: [],
      ignoredPaths: [],
      ignoreHidden: true,
      ignoreUnsupported: true,
      ...(options.config ? options.config : {}),
    }

    const config = new zJson(
      join(options.basePath + CLIENT_CONFIG_FILE_NAME),
      SHELF_CLIENT_CONFIG_SCHEMA,
      objthing,
    )

    const choki = chokidar.watch(
      [options.basePath, ...config.get('additionalPaths')],
      {
        ignored: [
          ...config.get('ignoredPaths'),
          // config.get('ignoreHidden') ? '**/.**' : '', //FIXME:Not Working
          config.get('ignoreUnsupported') ? globSupportedFormats : '',
          `**/**.${__DBEXTENSION}`,
        ],
        followSymlinks: false,
      },
    )

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
