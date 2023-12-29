import {FSWatcher} from 'chokidar'
import {statSync} from 'fs'
import path, {normalize} from 'path'
import {Prettify} from '../../types/utils'

export function normalizePath(path: string) {
  return normalize(path)
}

type BaseShelfFile = {
  filePath: string
  modifiedTimeMS: number
}

export type ShelfDirectory = BaseShelfFile
export type ShelfFile = BaseShelfFile & {extension: string}
export type ShelfDirectoryOrFile = Prettify<ShelfDirectory | ShelfFile>

/**
 * Choki Directory tree
 */
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

export function toShelfDirectoryOrFile(filePath: string) {
  const stats = statSync(filePath)
  const normalizedPath = normalizePath(filePath)

  if (stats.isDirectory()) {
    return {
      filePath: normalizedPath,
      modifiedTimeMS: stats.mtimeMs,
    } satisfies ShelfDirectoryOrFile
  }

  return {
    filePath: normalizedPath,
    modifiedTimeMS: stats.mtimeMs,
    extension: path.parse(filePath).ext,
  } satisfies ShelfDirectoryOrFile
}

export function arrayToShelfFile(filePaths: string[]) {
  return filePaths
    .map(toShelfDirectoryOrFile)
    .filter((path) => 'extension' in path) as ShelfFile[]
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
 * Filter out Directories from Choki directory tree, and returns an array of FileTuple.
 * */
export const filterDirectoryTree = (tree: DirectoryTree): ShelfFile[] =>
  arrayToShelfFile(flattenDirectoryTree(tree))
