const videoFormats = [
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

const imgFormats = [
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
  ...videoFormats.map((v) => v.slice(1)),
  ...imgFormats.map((v) => v.slice(1)),
].join('|')})`

const imgFormatsSet = new Set(imgFormats)
const videoFormatsSet = new Set(videoFormats)

export const checkFormat = (extension: string) => {
  if (imgFormatsSet.has(extension)) {
    return 'image'
  }

  if (videoFormatsSet.has(extension)) {
    return 'video'
  }

  return 'unrecognized'
}
