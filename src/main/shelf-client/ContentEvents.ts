import {Op} from 'sequelize'
import {Tag, Content, Path} from '../db/models'
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

  const {paths, tagIds} = options.query.reduce(
    (prev, current) => {
      switch (current.type) {
        case 'tag':
          prev.tagIds.push(current.tag.id)
          break
        case 'path':
          prev.paths.push(current.path)
          break
      }
      return prev
    },
    {paths: [], tagIds: []} as {paths: string[]; tagIds: number[]},
  )

  return await ListContent(
    client.ShelfDB,
    options.pagination ?? {offset: 25, limit: 25},
  )
}

async function getDetailedContent(
  id: IpcMainEvents['getDetailedContent']['args'][0],
) {
  const client = requestClient()

  return await ContentDetails(client.ShelfDB, id)
}
