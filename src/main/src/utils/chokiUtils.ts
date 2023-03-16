import {FSWatcher} from 'chokidar'
import {statSync} from 'fs'

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
    return [p, mtimeMs]
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
    const foundInNew = newFiles.findIndex((newFile) => newFile[0] === of[0])

    if (foundInNew === -1) {
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
