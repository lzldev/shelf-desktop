import type {PathLike} from 'fs'
import {copyFile, readdir, rm, stat} from 'fs/promises'
import {join} from 'path'

export const tempTestPath = './temp/'
const exampleContentPath = './test/content'

export const clearTempDir = async () => {
  const files = await readdir(tempTestPath)
  if (files.length === 0) {
    return
  }

  return Promise.allSettled(
    files.map((file) => {
      return rm(tempTestPath + file)
    }),
  )
}

export const testContent = await (async () => {
  return await Promise.all(
    (
      await readdir(exampleContentPath)
    ).map(async (file) => {
      const fullPath = join(exampleContentPath, file)
      const stats = await stat(fullPath)

      console.log(fullPath, ' -> ', formatFileSize(stats.size))

      return {
        fullPath,
        copy: (newPath: PathLike) => copyFile(fullPath, newPath),
        /**
         * @param tempName file name in Temp DIR
         * @returns  the new file path
         */
        copytoTemp: async (tempName: string) => {
          const newFile = join(tempTestPath, tempName)
          await copyFile(fullPath, newFile)
          return newFile
        },
        stats,
      }
    }),
  )
})()

export function formatFileSize(size: number) {
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}
