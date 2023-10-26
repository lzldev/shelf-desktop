import * as readline from 'readline'
import {SHELF_LOGGER} from './utils/Loggers'
import {ShelfClient} from './shelf-client/ShelfClient'
import {app} from 'electron'
import {Content, Path, Tag} from './db/models'

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
        const content = await Content.findAll({
          include: [{model: Tag}, {model: Path}],
        })

        SHELF_LOGGER.info(content)
        break
      }
      default: {
        break
      }
    }
  })

  return
}
