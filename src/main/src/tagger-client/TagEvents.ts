import {ipcMain} from 'electron'
import {Tag} from '../db/models/Tag'
import {requestClient} from '../..'
import {IpcMainEvents} from '../../../preload/ipcMainTypes'
import {ContentTag, TagColor} from '../db/models'
import {TaggerClient} from './TaggerClient'
import {Op} from 'sequelize'
import {ContentTagFields} from '../db/models/ContentTag'

export function defaultHandler(func: (...any: any[]) => any) {
  return async (_: Electron.IpcMainInvokeEvent, ...args: any[]) => {
    const client = requestClient()

    if (!client || !client.ready) {
      //TODO: Handle this
      throw 'unlucky'
    }
    return await JSON.parse(JSON.stringify(await func(...args)))
  }
}

ipcMain.handle('getTaggerTags', defaultHandler(getAllTags))
ipcMain.handle('removeTagfromContent', defaultHandler(removeTagFromContent))
ipcMain.handle('addTagToContent', defaultHandler(addTagToContent))
ipcMain.handle('createTag', defaultHandler(createTag))
ipcMain.handle('editTags', defaultHandler(editTags))
ipcMain.handle('batchTagging', defaultHandler(batchTagging))

async function getAllTags() {
  const result = await Tag.findAll({
    attributes: ['id', 'name', 'colorId'],
  })
  return result
}

//FIXME Implement this in the new event handlers
// @TaggerClient.SendEventAfter('updateColors')
// @TaggerClient.SendEventAfter('updateTags')
async function createTag(options: IpcMainEvents['createTag']['args']) {
  //TODO: REFACTOR Look into this
  let colorId
  if ('colorId' in options) {
    colorId = options.colorId
  } else {
    const color = await TagColor.build({
      name: options.newColor.name,
      color: options.newColor.color,
    }).save()

    colorId = color.id
  }

  const tagBuild = Tag.build({
    name: options.name,
    parentOnly: options.parentOnly,
    colorId,
  })

  try {
    return !!(await tagBuild.save())
  } catch (err) {
    return false
  }
}

async function removeTagFromContent(
  options: IpcMainEvents['removeTagfromContent']['args'],
) {
  console.log('options ->', options)
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

// @TaggerClient.SendEventAfter('updateColors')
// @TaggerClient.SendEventAfter('updateTags')
async function editTags(operations: IpcMainEvents['editTags']['args'][0]) {
  const client = requestClient() as TaggerClient
  const editTagsTransaction = await client.models.sequelize.transaction()

  for (const op of operations) {
    switch (op.operation) {
      case 'CREATE': {
        //TODO: Check if operation is being Spread here
        await Tag.build({...op}).save({
          transaction: editTagsTransaction,
        })
        continue
      }
      case 'UPDATE': {
        const {id: toBeUpdatedId, operation, ...values} = op
        await Tag.update(
          {...values},
          {where: {id: toBeUpdatedId}, transaction: editTagsTransaction},
        )
        continue
      }
      case 'DELETE': {
        await Tag.destroy({
          where: {
            id: op.id,
          },
          transaction: editTagsTransaction,
        })
        continue
      }
      default:
        throw 'UNEXPECTED OPERATION'
    }
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

    const client = requestClient() as TaggerClient

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
