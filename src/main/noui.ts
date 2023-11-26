import * as readline from 'readline'
import {SHELF_LOGGER} from './utils/Loggers'
import {ShelfClient} from './shelf-client/ShelfClient'
import {app} from 'electron'

export async function noUIMode() {
  if (!import.meta.env.MAIN_VITE_NO_UI_PATH) {
    throw 'INVALID PATH FOR [NO_UI] MODE'
  }

  SHELF_LOGGER.info('STARTING IN NO_UI MODE')

  const Client = await ShelfClient.create(
    {
      basePath: import.meta.env.MAIN_VITE_NO_UI_PATH,
      config: {
        ignoredPaths: ['./examples/ignored/*'],
      },
    },
    () => {},
  )

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  rl.on('SIGINT', () => {
    app.exit()
  })

  rl.on('line', async (str) => {
    switch (str) {
      case 'l':
        console.log(Client.getWatchedFiles())
        break
      case 'c': {
        console.log('NOT REIMPLEMENTED IN KYSELY YET')
        break
      }
      default: {
        break
      }
    }
  })

  return
}
