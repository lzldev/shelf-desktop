const imgFormats = new Set([
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
])

const videoFormats = new Set([
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
])

export const checkFormat = (extension: string) => {
  if (imgFormats.has(extension)) {
    return 'image'
  }

  if (videoFormats.has(extension)) {
    return 'video'
  }

  return 'unrecognized'
}
