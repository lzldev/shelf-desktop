import {FSWatcher} from 'chokidar'
import {statSync} from 'fs'
import {normalize} from 'path'

export type FileTuple = [filePath: string, modifiedTimeMS: number]
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

export const toFileTuple = (filePaths: string[]) => {
  return filePaths.map((p) => {
    const {mtimeMs} = statSync(p)
    const normalizedPath = normalize(p)

    return [normalizedPath, mtimeMs]
  }) as FileTuple[]
}

export const toFileMap = (filePaths: string[]) => {
  const newSet = new Map<string, number>()
  filePaths.forEach((path) => {
    const {mtimeMs} = statSync(path)
    newSet.set(path, mtimeMs)
  })
  return newSet
}

/**
 *
 * Filter out Directories from Choki directory tree, and returns an array of FileTuple.
 * */
export const filterDirectoryTree = (tree: DirectoryTree): FileTuple[] =>
  toFileTuple(
    flattenDirectoryTree(tree).filter((p) => !statSync(p).isDirectory()),
  )
