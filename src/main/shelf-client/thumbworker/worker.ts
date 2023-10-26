import {
  isMainThread,
  parentPort,
  threadId,
  workerData as _workerData,
} from 'node:worker_threads'

import {
  ThumbWorkerDataParser,
  ThumbWorkerInvoke,
  ThumbWorkerReceive,
} from './types'

import {createPortWrapper, handleWorkerMessage} from '../../utils/Worker'
import {createWorkerLogger} from '../../utils/Loggers'

import sharp from 'sharp'
import ffmpegStatic from 'ffmpeg-static'
import {exec} from 'node:child_process'
import {join} from 'node:path'

const workerData = ThumbWorkerDataParser.parse(_workerData)

if (isMainThread) {
  throw new Error('Worker called in main thread')
} else if (!parentPort) {
  throw new Error('Worker Parent port missing')
}

if (!ffmpegStatic) {
  throw new Error('FFMPEG not found.')
}

const port = parentPort!
const postMessage = createPortWrapper<ThumbWorkerReceive>(port)
const LOGGER = createWorkerLogger(threadId, 'THUMBWORKER', 5)

LOGGER.info('Starting')
LOGGER.info(`ffmpeg: ${ffmpegStatic}`)

async function main() {
  handleWorkerMessage<ThumbWorkerInvoke>(port, {
    resize_video: async ({data}) => {
      LOGGER.info('Video preview')

      const video_preview = await videoPreviewExec(
        data.filePath,
        data.hash,
      ).catch((e) => {
        LOGGER.error(
          `Video preview error in ${data.filePath} ${JSON.stringify(e)}`,
        )

        postMessage('preview_error', {
          type: 'preview_error',
          data: {
            hash: data.hash,
          },
        })
      })

      if (!video_preview) {
        return
      }

      LOGGER.info(`Video preview success ${video_preview}`)

      postMessage('preview_ready', {
        type: 'preview_ready',
        data: {
          hash: data.hash,
        },
      })
    },
    resize_image: async ({data}) => {
      const out = await resizeImage(data.filePath, data.hash).catch((e) => {
        LOGGER.error(`error in ${data.filePath} ${JSON.stringify(e)}`)

        postMessage('preview_error', {
          type: 'preview_error',
          data: {
            hash: data.hash,
          },
        })
      })

      // LOGGER.info(`Image preview ${out}`)

      if (!out) {
        return
      }

      postMessage('preview_ready', {
        type: 'preview_ready',
        data: {
          hash: data.hash,
        },
      })
    },
  })
}

main()

async function resizeImage(filePath: string, hash: string) {
  const image = sharp(filePath, {
    failOn: 'none',
  }).resize({
    width: 300,
    withoutEnlargement: true,
  })

  const out = join(workerData.thumbnailPath, hash + '.jpg')

  return image.toFile(out)
}

function videoOutPath(fileName: string) {
  return join(workerData.thumbnailPath, fileName + '.jpg')
}

async function videoPreviewExec(inputFilePath: string, outputHash: string) {
  return new Promise((res, rej) => {
    const command = `${ffmpegStatic} -nostdin -y -i "${inputFilePath}" -vf thumbnail=160,scale=-1:300 -vframes 1 "${videoOutPath(
      outputHash,
    )}"`

    try {
      exec(
        command,
        {
          windowsHide: true,
          timeout: 10000,
        },
        (error, stdout, stderr) => {
          if (error) {
            LOGGER.error(`process exit with code ${error.code} \n${stderr}`)
            rej(error.code)
            return
          }

          res(true)
          return
        },
      )
    } catch (e) {
      rej(false)
    }
  })
}

