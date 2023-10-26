import {DocumentIcon} from '@heroicons/react/24/solid'
import {checkExtension} from '../utils/Extensions'
import clsx from 'clsx'
import {HTMLAttributes, useMemo, useRef, useState} from 'react'
import {Content} from '@models'
import {useConfigStore} from '../hooks/useConfig'
import {VideoPlayer} from './VideoPlayer'

function ShelfContent({
  content,
  contentProps,
  ...props
}: {
  content: Content
  contentProps?: HTMLAttributes<HTMLDivElement> &
    HTMLAttributes<HTMLVideoElement>
} & HTMLAttributes<HTMLDivElement>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const format = checkExtension(content.extension)
  const [hidden, setHidden] = useState(format === 'image')
  const [error, setError] = useState<string | null>(null)

  const uri = useMemo(() => {
    const path = content?.paths?.at(0)?.path

    const parsedPath = path
      ?.replaceAll('\\', '/')
      .split('/')
      .map((v) => encodeURIComponent(v))
      .join('/')

    return 'file://' + (parsedPath?.at(0) === '/' ? '' : '/') + parsedPath
  }, [])

  const thumbnailPath = useConfigStore((s) => s.config!.thumbnailPath)
  const preview_uri = 'file://' + thumbnailPath + content.hash + '.jpg'

  return (
    <div
      {...props}
      ref={containerRef}
      className={clsx(
        'relative overflow-clip',
        !hidden && format === 'video' ? '' : '',
        props.className,
      )}
    >
      {format === 'image' && !error ? (
        <>
          <img
            className={
              'absolute inset-0 -z-10 h-full w-full scale-150 transform-gpu object-contain opacity-25 blur-2xl saturate-200'
            }
            src={uri}
          />
          <img
            {...contentProps}
            onLoad={() => {
              setHidden(false)
            }}
            onError={(evt) => {
              setError(`${evt.type} Loading Image`)
            }}
            className={clsx(
              hidden ? 'opacity-0' : '',
              'mx-auto h-full object-contain transition-opacity',
              contentProps?.className,
            )}
            src={uri}
          />
        </>
      ) : format === 'video' && !error ? (
        <div className='relative flex h-full w-full'>
          <img
            className={
              'absolute inset-auto -z-10 h-full w-full scale-150 object-contain opacity-75 blur-2xl saturate-200'
            }
            height={300}
            src={preview_uri}
          />
          <video
            {...contentProps}
            src={uri}
            className={clsx(
              'h-full w-full object-contain',
              contentProps?.className,
            )}
            onProgress={() => {
              setHidden(false)
            }}
            controls
            autoPlay
          />
        </div>
      ) : (
        <div className='flex h-full flex-col items-center justify-center overflow-clip'>
          <DocumentIcon className='h-8 w-8 fill-gray-300' />
          <span
            dir={!content.extension ? 'rtl' : undefined}
            className='mt-1 w-2/3 truncate text-center font-mono text-gray-100'
          >
            {content.extension || uri}
          </span>
          {error && (
            <span
              dir={!content.extension ? 'rtl' : undefined}
              className='mt-1 w-2/3 truncate text-center font-mono text-gray-100'
            >
              {error}
            </span>
          )}
        </div>
      )}
      {props.children}
    </div>
  )
}

export {ShelfContent}
