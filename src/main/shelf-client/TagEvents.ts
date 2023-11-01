import {ipcMain} from 'electron'
import {Tag} from '../db/models/Tag'
import {requestClient, sendEventAfter} from '../'
import {IpcMainEvents} from '../../preload/ipcMainTypes'
import {ContentTag} from '../db/models'
import {ShelfClient} from './ShelfClient'
import {Op} from 'sequelize'
import {ContentTagFields} from '../db/models/ContentTag'
import {dialog} from 'electron'

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
  const result = await Tag.findAll({
    attributes: ['id', 'name', 'colorId'],
  })
  return result
}

async function removeTagFromContent(
  options: IpcMainEvents['removeTagfromContent']['args'],
) {
  const newRelation = await ContentTag.findOne({
    where: {
      contentId: options.contentId,
      tagId: options.tagId,
    },
  })
  try {
    await newRelation?.destroy()
    return true
  } catch (e) {
    return false
  }
}

async function addTagToContent(
  options: IpcMainEvents['addTagToContent']['args'],
) {
  const newRelation = await ContentTag.build({
    contentId: options.contentId,
    tagId: options.tagId,
  })
  try {
    await newRelation.save()
    return true
  } catch (e) {
    return false
  }
}

async function editTags(operations: IpcMainEvents['editTags']['args'][0]) {
  const client = requestClient() as ShelfClient
  const editTagsTransaction = await client.ShelfDB.sequelize.transaction()

  try {
    for (const op of operations) {
      switch (op.operation) {
        case 'CREATE': {
          await Tag.build({...op})
            .save({
              transaction: editTagsTransaction,
            })
            .catch((err) => {
              throw err
            })
          continue
        }
        case 'UPDATE': {
          const {id: toBeUpdatedId, operation, ...values} = op
          await Tag.update(
            {...values},
            {where: {id: toBeUpdatedId}, transaction: editTagsTransaction},
          ).catch((err) => {
            throw err
          })
          continue
        }
        case 'DELETE': {
          await Tag.destroy({
            where: {
              id: op.id,
            },
            transaction: editTagsTransaction,
          }).catch((err) => {
            throw err
          })
          continue
        }
        default:
          throw 'UNEXPECTED OPERATION'
      }
    }
  } catch (err) {
    await editTagsTransaction.rollback()
    dialog.showErrorBox('Error', JSON.stringify(err))
    return false
  }

  await editTagsTransaction.commit()
  return true
}

async function batchTagging(
  operations: IpcMainEvents['batchTagging']['args'][0],
) {
  if (operations.operation === 'ADD') {
    const ids: ContentTagFields[] = []

    for (const tagId of operations.tagIds) {
      for (const contentId of operations.contentIds) {
        ids.push({
          tagId,
          contentId,
        })
      }
    }

    await ContentTag.bulkCreate(ids, {
      ignoreDuplicates: true,
    })

    return true
  }

  if (operations.operation === 'REMOVE') {
    const bulkDestroyTransaction = await (
      requestClient() as ShelfClient
    ).ShelfDB.sequelize.transaction()

    await ContentTag.destroy({
      where: [
        {
          tagId: {
            [Op.or]: operations.tagIds,
          },
          contentId: {
            [Op.or]: operations.contentIds,
          },
        },
      ],
      transaction: bulkDestroyTransaction,
    })

    await bulkDestroyTransaction.commit()

    return true
  }

  return false
}
