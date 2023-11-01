import {TagColor} from '../db/models'
import {IpcMainEvents} from '../../preload/ipcMainTypes'
import {defaultHandler} from './TagEvents'
import {dialog, ipcMain} from 'electron'
import {requestClient, sendEventAfter} from '../'
import {ShelfClient} from './ShelfClient'

ipcMain.handle('getShelfColors', defaultHandler(getColors))
ipcMain.handle(
  'editColors',
  sendEventAfter(['updateColors'], defaultHandler(editColors)),
)

async function getColors() {
  const result = await TagColor.findAll()
  return result
}

async function editColors(operations: IpcMainEvents['editColors']['args'][0]) {
  const client = requestClient() as ShelfClient
  const editColorsTransaction = await client.ShelfDB.sequelize.transaction()

  try {
    for (const op of operations) {
      switch (op.operation) {
        case 'CREATE': {
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
