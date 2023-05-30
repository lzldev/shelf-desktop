import {TagColor} from '../db/models'
import {IpcMainEvents} from '../../../preload/ipcMainTypes'
import {defaultHandler} from './TagEvents'
import {dialog, ipcMain} from 'electron'
import {requestClient} from '../..'
import {ShelfClient} from './ShelfClient'
import {sendEventAfter} from '.'

ipcMain.handle('getShelfColors', defaultHandler(getColors))
ipcMain.handle(
  'editColors',
  sendEventAfter(['updateColors'], defaultHandler(editColors)),
)

async function getColors() {
  const result = await TagColor.findAll({
    attributes: ['id', 'color', 'name'],
  })
  return result
}

async function editColors(operations: IpcMainEvents['editColors']['args'][0]) {
  const client = (await requestClient()) as ShelfClient
  const editColorsTransaction = await client.models.sequelize.transaction()

  try {
    for (const op of operations) {
      switch (op.operation) {
        case 'CREATE': {
          //TODO: Check if operation is being Spread here
          await TagColor.build({...op})
            .save({
              transaction: editColorsTransaction,
            })
            .catch((err) => {
              throw err
            })
          continue
        }
        case 'UPDATE': {
          const {id: toBeUpdatedId, operation, ...values} = op
          await TagColor.update(
            {...values},
            {where: {id: toBeUpdatedId}, transaction: editColorsTransaction},
          ).catch((err) => {
            throw err
          })
          continue
        }
        case 'DELETE': {
          await TagColor.destroy({
            where: {
              id: op.id,
            },
            transaction: editColorsTransaction,
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
    await editColorsTransaction.rollback()
    dialog.showErrorBox('Error', JSON.stringify(err))
    return false
  }

  await editColorsTransaction.commit()
  return true
}
