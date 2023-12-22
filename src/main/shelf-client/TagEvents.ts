import {ipcMain} from 'electron'
import {requestClient, sendEventAfter} from '../'
import {IpcMainEvents} from '../../preload/ipcMainTypes'
import {InsertObject} from 'kysely'
import {DB} from '../db/kysely-types'
import {SHELF_LOGGER} from '../utils/Loggers'
import {CreateTagContent} from '../db/TagContentControllers'

export function defaultHandler(func: (...any: any[]) => any) {
  return async (_: Electron.IpcMainInvokeEvent, ...args: any[]) => {
    const client = requestClient()

    if (!client || !client.ready) {
      throw 'Client not Ready'
    }

    return await JSON.parse(JSON.stringify(await func(...args)))
  }
}

ipcMain.handle('getShelfTags', defaultHandler(getAllTags))
ipcMain.handle('removeTagfromContent', defaultHandler(removeTagFromContent))
ipcMain.handle('addTagToContent', defaultHandler(addTagToContent))
ipcMain.handle(
  'editTags',
  sendEventAfter(['updateTags'], defaultHandler(editTags)),
)
ipcMain.handle('batchTagging', defaultHandler(batchTagging))

async function getAllTags() {
  const client = requestClient()

  return await client.ShelfDB.selectFrom('Tags')
    .select(['id', 'name', 'colorId'])
    .execute()
}

async function removeTagFromContent(
  options: IpcMainEvents['removeTagfromContent']['args'],
) {
  const client = requestClient()

  const del = await client.ShelfDB.deleteFrom('ContentTags')
    .where((eb) =>
      eb.and([
        eb('contentId', '=', options.contentId),
        eb('tagId', '=', options.tagId),
      ]),
    )
    .executeTakeFirst()

  if (Number(del.numDeletedRows) === 1) {
    return true
  } else {
    return false
  }
}

async function addTagToContent(
  options: IpcMainEvents['addTagToContent']['args'],
) {
  const client = requestClient()

  const result = await CreateTagContent(client.ShelfDB, options)

  if (Number(result.numInsertedOrUpdatedRows) === 1) {
    return true
  } else {
    return false
  }
}

async function editTags(operations: IpcMainEvents['editTags']['args'][0]) {
  const client = requestClient()

  await client.ShelfDB.transaction()
    .execute(async (trx) => {
      const toBeAdded: InsertObject<DB, 'Tags'>[] = []

      for (const op of operations) {
        if (op.operation === 'CREATE') {
          toBeAdded.push({
            colorId: op.colorId,
            name: op.name,
          })
          continue
        } else if (op.operation === 'UPDATE') {
          await trx
            .updateTable('Tags')
            .where('id', '=', op.id)
            .set({colorId: op.colorId, name: op.name})
            .execute()
          continue
        } else if (op.operation === 'DELETE') {
          await trx.deleteFrom('Tags').where('id', '=', op.id).execute()
          continue
        }
      }

      await trx.insertInto('Tags').values(toBeAdded).execute()
    })
    .catch(() => {
      SHELF_LOGGER.error('Failed to EDIT tags')
      return false
    })

  return true
}

async function batchTagging(
  operations: IpcMainEvents['batchTagging']['args'][0],
) {
  if (operations.operation === 'ADD') {
    await requestClient()
      .ShelfDB.insertInto('ContentTags')
      .values(
        operations.tagIds.flatMap((tagid) => {
          return operations.contentIds.map((contentid) => {
            return {
              contentId: contentid,
              tagId: tagid,
            }
          })
        }),
      )
      .execute()

    return true
  }

  if (operations.operation === 'REMOVE') {
    await requestClient()
      .ShelfDB.deleteFrom('ContentTags')
      .where((eb) =>
        eb.and([
          eb('contentId', 'in', operations.contentIds),
          eb('tagId', 'in', operations.tagIds),
        ]),
      )
      .execute()

    return true
  }

  return false
}
