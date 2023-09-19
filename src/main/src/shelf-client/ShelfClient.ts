import * as chokidar from 'chokidar'
import {__DBEXTENSION, createShelfDB, ShelfDBModels} from '../db/ShelfDB'
import {addChokiEvents} from './ChokiEvents'
import {FSWatcher} from 'chokidar'
import {zJson} from '../zJson'
import {join} from 'path'

import {
  CLIENT_CONFIG_FILE_NAME,
  SHELF_CLIENT_CONFIG_SCHEMA,
  ShelfClientConfigValues,
} from '../ShelfConfig'

import {globSupportedFormats} from '../../../renderer/src/utils/formats'
import {IpcMainEvents} from '../../../preload/ipcMainTypes'

class ShelfClient {
  public choki: FSWatcher
  public ShelfDB: ShelfDBModels
  public ready = false
  public config: zJson<
    typeof SHELF_CLIENT_CONFIG_SCHEMA,
    ShelfClientConfigValues
  >

  static async create(
    options: IpcMainEvents['startShelfClient']['args'][0],
    callback: () => void,
  ) {
    console.log('[CLIENT] OPTIONS ->', options)
    const ShelfDB = await createShelfDB(options.basePath)

    const config = new zJson(
      join(options.basePath + CLIENT_CONFIG_FILE_NAME),
      SHELF_CLIENT_CONFIG_SCHEMA,
      {
        additionalPaths: [],
        ignoredPaths: [],
        ignoreHidden: true,
        ignoreUnsupported: true,
        ...(options.config ? options.config : {}),
      },
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
    this.ShelfDB = newInstance.ShelfDB
    this.choki = newInstance.choki
    this.config = newInstance.config

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
