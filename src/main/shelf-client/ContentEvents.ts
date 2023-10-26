import {Op} from 'sequelize'
import {Tag, Content, Path} from '../db/models'
import {IpcMainEvents} from '../../preload/ipcMainTypes'
import {defaultHandler} from './TagEvents'
import {ipcMain} from 'electron'

ipcMain.handle('getShelfContent', defaultHandler(getContent))
ipcMain.handle('getDetailedImage', defaultHandler(getDetailedContent))

async function getContent(options: IpcMainEvents['getShelfContent']['args']) {
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
            [Op.or]: paths.map((p) => {
              return {[Op.like]: `%${p}%`}
            }),
          },
        },
      },
      {
        model: Tag,
        attributes: ['id', 'colorId'],
        where:
          tagIds.length !== 0
            ? {
                id: tagIds,
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
