import {createHash} from 'crypto'
import {createReadStream} from 'fs'
import {FileTuple} from './FileTuple'

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

export function hashFileTuple(file: FileTuple) {
  return hashFileAsync(file[0])
}

export async function hashFileTuples(
  files: FileTuple[],
  callback?: (fileName: string) => any,
) {
  const hashToPathRecord: Record<string, number[]> = {}

  await Effect.runPromise(
    Effect.all(
      files.map((file, watchedFileIndex) =>
        Effect.promise(async () => {
          const hash = await hashFileAsync(file[0]).catch((e) => {
            console.error(e)
            throw e
          })

          if (callback) {
            callback(file[0])
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
