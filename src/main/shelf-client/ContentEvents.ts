import {Op} from 'sequelize'
import {Tag, Content, Path} from '../db/models'
import {IpcMainEvents} from '../../preload/ipcMainTypes'
import {defaultHandler} from './TagEvents'
import {ipcMain} from 'electron'

ipcMain.handle('getShelfContent', defaultHandler(getContent))
ipcMain.handle('getDetailedImage', defaultHandler(getDetailedContent))

async function getContent(options: IpcMainEvents['getShelfContent']['args']) {
  const order = options?.order ? [options?.order] : undefined

  const TagIdArray =
    options?.tags && options?.tags?.length !== 0
      ? options.tags.map((tag) => tag.id)
      : undefined

  const {offset, limit} = options?.pagination || {}

  const {rows, count} = await Content.findAndCountAll({
    order: order,
    offset: offset,
    limit: limit,
    include: [
      {
        model: Path,
        where: {
          path: {
            [Op.or]: options.paths?.map((p) => {
              return {[Op.like]: `%${p.value}%`}
            }),
          },
        },
      },
      {
        model: Tag,
        attributes: ['id', 'colorId'],
        where: TagIdArray
          ? {
              id: TagIdArray,
            }
          : undefined,
      },
    ],
  })

  let nextCursor
  if (typeof offset === 'number' && typeof limit === 'number') {
    const nextOffset = offset + limit
    const diffToEnd = count - nextOffset

    if (nextOffset < count) {
      nextCursor = {
        offset: nextOffset,
        limit: diffToEnd < limit ? diffToEnd : limit,
      }
    }
  }

  return {content: rows, nextCursor}
}

async function getDetailedContent(
  id: IpcMainEvents['getDetailedImage']['args'],
) {
  const result = await Content.findOne({
    where: {
      id: id,
    },
    include: [
      {model: Path},
      {
        model: Tag,
        attributes: ['id', 'name', 'colorId'],
      },
    ],
  })

  return result
}
