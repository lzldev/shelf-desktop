const videoExtensions = [
  '.3gp',
  '.3g2',
  '.asf',
  '.avi',
  '.flv',
  '.h264',
  '.m4v',
  '.mkv',
  '.mov',
  '.mp4',
  '.mpg',
  '.mpeg',
  '.ogv',
  '.rm',
  '.swf',
  '.vob',
  '.webm',
  '.wmv',
]

const imgExtensions = [
  '.jpg',
  '.jpeg',
  '.jfif',
  '.pjpeg',
  '.pjp',
  '.apng',
  '.avif',
  '.gif',
  '.png',
  '.svg',
  '.webp',
  '.bmp',
  '.ico',
  '.cur',
  '.tif',
  '.tiff',
]

export const globSupportedFormats = `**/*.!(${[
  ...videoExtensions.map((v) => v.slice(1)),
  ...imgExtensions.map((v) => v.slice(1)),
].join('|')})`

const imgExtensionsSet = new Set(imgExtensions)
const videoExtensionsSet = new Set(videoExtensions)

export const checkExtension = (extension: string) => {
  if (imgExtensionsSet.has(extension)) {
    return 'image'
  }

  if (videoExtensionsSet.has(extension)) {
    return 'video'
  }

  return 'unrecognized'
}

/**
 *
 * Checks if file extension is able to be classified by Mobilenet
 * */
export const canClassify = (fileExtension: string) => {
  if (fileExtension === '.webp') {
    return false
  }

  return checkExtension(fileExtension) === 'image'
}
