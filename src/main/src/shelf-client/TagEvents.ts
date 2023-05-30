import {ipcMain} from 'electron'
import {Tag} from '../db/models/Tag'
import {requestClient} from '../..'
import {IpcMainEvents} from '../../../preload/ipcMainTypes'
import {ContentTag} from '../db/models'
import {ShelfClient} from './ShelfClient'
import {Op} from 'sequelize'
import {ContentTagFields} from '../db/models/ContentTag'
import {sendEventAfter} from '.'
import {dialog} from 'electron'

export function defaultHandler(func: (...any: any[]) => any) {
  return async (_: Electron.IpcMainInvokeEvent, ...args: any[]) => {
    const client = requestClient()

    if (!client || !client.ready) {
      //TODO: Handle this.
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
  const editTagsTransaction = await client.models.sequelize.transaction()

  try {
    for (const op of operations) {
      switch (op.operation) {
        case 'CREATE': {
          //TODO: Check if operation is being Spread here
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
  const ids: ContentTagFields[] = []

  if (operations.operation === 'ADD') {
    for (let x = 0; x < operations.tagIds.length; x++) {
      for (let y = 0; y < operations.contentIds.length; y++) {
        ids.push({
          tagId: operations.tagIds[x],
          contentId: operations.contentIds[y],
        })
      }

      await ContentTag.bulkCreate(ids, {
        ignoreDuplicates: true,
      })
      return true
    }
  }

  if (operations.operation === 'REMOVE') {
    const relations = await ContentTag.findAll({
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
    })

    if (relations.length === 0) {
      return false
    }

    const client = requestClient() as ShelfClient

    const removeTagsFromContentTransaction =
      await client.models.sequelize.transaction()

    for (let i = 0; i < relations.length; i++) {
      await relations[i].destroy({
        transaction: removeTagsFromContentTransaction,
      })
    }

    await removeTagsFromContentTransaction.commit()

    return
  }

  return false
}
