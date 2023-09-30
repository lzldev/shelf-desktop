import {FSWatcher} from 'chokidar'
import {statSync} from 'fs'
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

export const toFileMap = (pathArr: string[]) => {
  const newSet = new Map<string, number>()
  pathArr.forEach((path) => {
    const {mtimeMs} = statSync(path)
    newSet.set(path, mtimeMs)
  })
  return newSet
}
