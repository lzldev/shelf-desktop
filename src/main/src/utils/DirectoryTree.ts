import { FSWatcher } from 'chokidar'

export type DirectoryTree = ReturnType<typeof FSWatcher.prototype.getWatched>
//          ^?

export const flattenDirectoryTree = (tree: DirectoryTree): string[] => {
  const paths: string[] = []
  Object.entries(tree).forEach(([dir, files]) => {
    files.forEach((file) => {
      paths.push(dir + '/' + file)
    })
  })
  return paths
}
