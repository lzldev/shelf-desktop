import {FSWatcher} from 'chokidar'
import {existsSync, statSync} from 'fs'
import {normalize} from 'path'

export type DirectoryTree = ReturnType<typeof FSWatcher.prototype.getWatched>

export const flattenDirectoryTree = (tree: DirectoryTree): string[] => {
  const paths: string[] = []
  Object.entries(tree).forEach(([dir, files]) => {
    files.forEach((file) => {
      paths.push(dir + '/' + file)
    })
  })
  return paths
}

export type FileTuple = [string, number]

export const toFileTuple = (stringArr: string[]) => {
  return stringArr.map((p) => {
    const {mtimeMs} = statSync(p)
    const normalizedPath = normalize(p)

    return [normalizedPath, mtimeMs]
  }) as FileTuple[]
}

export const compareOldFiles = (
  newFiles: FileTuple[],
  oldFiles: FileTuple[],
) => {
  const toBeAdded: FileTuple[] = []
  const toBeUpdated: FileTuple[] = []
  const toBeRemoved: FileTuple[] = []

  newFiles.forEach((newFile) => {
    const foundInOld = oldFiles.findIndex((lf) => {
      return lf[0] === newFile[0]
    })

    if (foundInOld === -1) {
      toBeAdded.push(newFile)
      return
    } else if (oldFiles[foundInOld][1] < newFile[1]) {
      toBeUpdated.push(newFile)
      return
    }

    oldFiles.splice(foundInOld, 1)
  })

  //REMOVEME:Probably not needed since everthing has been cleaned up already the only ones that remain are supposed to be removed.
  oldFiles.forEach((of) => {
    const stillExists = existsSync(of[0])

    if (stillExists) {
      toBeRemoved.push(of)
      return
    }
  })

  return {
    toBeAdded,
    toBeRemoved,
    toBeUpdated,
  }
}
