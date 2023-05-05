import * as chokidar from 'chokidar'
import {createTaggerDB, TaggerDBModels} from '../db/TaggerDB'
import {addChokiEvents} from './ChokiEvents'
import {FSWatcher} from 'chokidar'
import {zJson} from '../zJson'
import {join} from 'path'
import {
  CLIENT_CONFIG_FILE_NAME,
  ClientConfigSchema,
  ClientConfigValues,
} from '../TaggerConfig'

class TaggerClient {
  private _choki: FSWatcher
  private _TaggerDB: TaggerDBModels
  private _ready = false
  private _config: zJson<ClientConfigSchema, ClientConfigValues>

  get config() {
    return this._config
  }
  get models() {
    return this._TaggerDB
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
    const TaggerDB = await createTaggerDB(
      Array.isArray(basePath) ? basePath[0] : basePath,
    )
    const config = new zJson(
      join(basePath + CLIENT_CONFIG_FILE_NAME),
      ClientConfigSchema,
      {
        additionalPaths: [],
      },
    )

    const choki = chokidar.watch([basePath, ...config.get('additionalPaths')], {
      ignoreInitial: true,
      ignored: [
        (str) => {
          return str.includes('.tagger')
        },
      ],
      followSymlinks: false,
    })

    return new TaggerClient({
      choki,
      TaggerDB,
      mainCallback: callback,
      config,
    })
  }
  protected constructor(newInstance: {
    choki: FSWatcher
    TaggerDB: TaggerDBModels
    config: zJson<ClientConfigSchema, ClientConfigValues>
    mainCallback: () => void
  }) {
    this._TaggerDB = newInstance.TaggerDB
    this._choki = newInstance.choki
    this._config = newInstance.config

    addChokiEvents(this, newInstance.mainCallback)

    return this
  }

  getWatchedFiles() {
    return this._choki.getWatched()
  }
}

export {TaggerClient}
