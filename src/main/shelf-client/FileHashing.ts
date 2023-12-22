import {createHash} from 'crypto'
import {createReadStream} from 'fs'
import {ShelfFile} from './ShelfFile'

import {Effect} from 'effect'

const HASHMAXBYTES = 10485760 - 1 //10 MB

export async function hashFileAsync(filePath: string) {
  return new Promise<string>((resolve, reject) => {
    try {
      const stream = createReadStream(filePath, {
        end: HASHMAXBYTES,
      })
      const hash = createHash('md5')

      stream.on('data', (_buff) => {
        hash.update(_buff)
      })
      stream.on('end', () => {
        resolve(hash.digest('hex'))
      })
      stream.on('error', (err) => {
        reject(err)
      })
    } catch (err) {
      reject(err)
    }
  })
}

export function hashShelfFile(shelfFile: ShelfFile) {
  return hashFileAsync(shelfFile.filePath)
}

export async function hashShelfFiles(
  files: ShelfFile[],
  callback?: (fileName: string) => any,
) {
  const hashToPathRecord: Record<string, number[]> = {}

  await Effect.runPromise(
    Effect.all(
      files.map((shelfFile, watchedFileIndex) =>
        Effect.promise(async () => {
          const hash = await hashFileAsync(shelfFile.filePath).catch((e) => {
            console.error(e)
            throw e
          })

          if (callback) {
            callback(shelfFile.filePath)
          }

          if (!hashToPathRecord[hash]) {
            hashToPathRecord[hash] = []
          }

          hashToPathRecord[hash].push(watchedFileIndex)
          return
        }),
      ),
      {
        concurrency: 'unbounded',
      },
    ),
  )

  return hashToPathRecord
}
