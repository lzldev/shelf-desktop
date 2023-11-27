import {FSWatcher} from 'chokidar'
import {statSync} from 'fs'
import path, {normalize} from 'path'

export type FileTuple = [
  filePath: string,
  modifiedTimeMS: number,
  extesion: string,
]

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

export function toFileTuple(
  p: string,
): [filePath: string, modifiedTimeMS: number, extesion: false | string] {
  const stats = statSync(p)
  const normalizedPath = normalize(p)
  const extesionOrDirectory = stats.isDirectory() ? false : path.parse(p).ext

  return [normalizedPath, stats.mtimeMs, extesionOrDirectory]
}

export function arrayToFileTuple(filePaths: string[]) {
  return filePaths
    .map(toFileTuple)
    .filter((path) => path[2] !== false) as FileTuple[]
}

export function toFileMap(filePaths: string[]) {
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
  arrayToFileTuple(flattenDirectoryTree(tree))
