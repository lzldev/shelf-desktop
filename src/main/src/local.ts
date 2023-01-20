import * as fs from 'fs'
import { parse } from 'path'
import { TaggerFile, TaggerImage, TaggerDir } from './types'

const scanDirs = (p: string, maxDepth: number, currDepth = 0): TaggerFile[] => {
  if (!p.endsWith('/')) {
    throw 'Path NEeds a / on asdiansdedn AFS{<PASFOP {M<AFPS MOPAMOSF MOPASF MOPADSF MOPASFMOP' + p
  }

  const results: TaggerFile[] = []

  try {
    fs.readdirSync(p, {
      withFileTypes: true
    }).forEach((readFile) => {
      const file = readFile as TaggerFile
      const isDir = file.isDirectory()

      // console.log(file.name, 'isDir', isDir, 'depth >', currDepth, 'maxDepth > ', maxDepth)

      file.fullPath = `${p}${(isDir && currDepth >= 1) || currDepth > 1 ? '/' : ''}${readFile.name}`

      /*
        TODO:Refactor depending on ORM
      */
      if (isDir && currDepth + 1 <= maxDepth) {
        const dir = file as TaggerDir
        dir.isDir = true
        dir.depth = currDepth + 1
        dir.children = scanDirs(dir.fullPath + '/', maxDepth, dir.depth)

        return results.push(dir)
      } else if (/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(file.name)) {
        const img = file as TaggerImage
        img.isImage = true

        return results.push(img)
      } else {
        return results.push(file)
      }
    })
  } catch (e) {
    console.log('ERROR [p] ', p, e)
  }

  return results
}

export { scanDirs }
