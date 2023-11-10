import {TagColor} from '../db/models'
import {IpcMainEvents} from '../../preload/ipcMainTypes'
import {defaultHandler} from './TagEvents'
import {dialog, ipcMain} from 'electron'
import {requestClient, sendEventAfter} from '../'
import {ShelfClient} from './ShelfClient'
import {InsertObject} from 'kysely'
import {DB} from '../db/kysely-types'
import {SHELF_LOGGER} from '../utils/Loggers'

ipcMain.handle('getShelfColors', defaultHandler(getColors))
ipcMain.handle(
  'editColors',
  sendEventAfter(['updateColors'], defaultHandler(editColors)),
)

async function getColors() {
  const client = requestClient()

  return await client.ShelfDB.selectFrom('TagColors').selectAll().execute()
}

async function editColors(operations: IpcMainEvents['editColors']['args'][0]) {
  const client = requestClient()

  await client.ShelfDB.transaction()
    .execute(async (trx) => {
      const newColors: InsertObject<DB, 'TagColors'>[] = []

      for (const op of operations) {
        if (op.operation === 'CREATE') {
          newColors.push({
            color: op.color,
            name: op.name,
          })
          continue
        }

        if (op.operation === 'UPDATE') {
          await trx
            .updateTable('TagColors')
            .where('id', '=', op.id)
            .set({color: op.color, name: op.name})
            .execute()
          continue
        }

        if (op.operation === 'DELETE') {
          await trx.deleteFrom('TagColors').where('id', '=', op.id).execute()
          continue
        }
      }
    })
    .catch(() => {
      SHELF_LOGGER.error('Failed to EDIT colors')
      return false
    })

  return true
}
