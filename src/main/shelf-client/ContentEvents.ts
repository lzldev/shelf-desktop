import {IpcMainEvents} from '../../preload/ipcMainTypes'
import {defaultHandler} from './TagEvents'
import {ipcMain} from 'electron'
import {requestClient} from '..'
import {ContentDetails, ListContent} from '../db/ContentControllers'

ipcMain.handle('getShelfContent', defaultHandler(getContent))
ipcMain.handle('getDetailedContent', defaultHandler(getDetailedContent))

async function getContent(options: IpcMainEvents['getShelfContent']['args']) {
  const client = requestClient()

  const order = options?.order ? [options?.order] : undefined

  return await ListContent(client.ShelfDB, options)
}

async function getDetailedContent(
  id: IpcMainEvents['getDetailedContent']['args'][0],
) {
  const client = requestClient()

  return await ContentDetails(client.ShelfDB, id)
}
