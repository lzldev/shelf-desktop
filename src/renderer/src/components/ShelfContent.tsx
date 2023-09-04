import {DocumentIcon} from '@heroicons/react/24/solid'
import {checkFormat} from '@renderer/utils/formats'
import clsx from 'clsx'
import {HTMLAttributes, useMemo, useRef, useState} from 'react'
import {Content} from '@models'

function ShelfContent({
  content,
  contentProps,
  controls,
  ...props
}: {
  content: Content
  controls?: boolean
  contentProps?: HTMLAttributes<HTMLDivElement> &
    HTMLAttributes<HTMLVideoElement>
} & HTMLAttributes<HTMLDivElement>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const format = checkFormat(content.extension)
  const [hidden, setHidden] = useState(format === 'image')
  const [error, setError] = useState<string | null>(null)

  const uri = useMemo(() => {
    const path = content?.paths?.at(0)?.path

    const parsed_path = path
      ?.replaceAll('\\', '/')
      .split('/')
      .map((v) => encodeURIComponent(v))
      .join('/')

    return 'file://' + parsed_path
  }, [])

  return (
    <div
      {...props}
      ref={containerRef}
      className={clsx(
        'relative overflow-clip',
        !hidden && format === 'video' ? '' : '',
        hidden && format === 'image'
          ? 'animate-gradient_x_fast bg-gradient-to-r from-gray-400 to-gray-800 opacity-50 duration-2500'
          : '',
        props.className,
      )}
    >
      {format === 'image' && !error ? (
        <>
          <img
            className={
              'absolute inset-0 -z-10 h-full w-full scale-150 object-contain opacity-25 blur-2xl saturate-200'
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
              setHidden(false)
            }}
            hidden={hidden}
            className={clsx(
              'mx-auto h-full object-contain ',
              contentProps?.className,
            )}
            src={uri}
          />
        </>
      ) : format === 'video' && !error ? (
        <div className='relative flex h-full w-full'>
          <video
            className={
              'absolute inset-auto -z-10 h-full w-full scale-150 object-contain opacity-75 blur-2xl saturate-200'
            }
            src={uri}
            autoPlay={false}
          />
          <video
            {...contentProps}
            src={uri}
            className={clsx(
              'h-full w-full object-contain',
              contentProps?.className,
            )}
            controls={controls && !hidden}
            onProgress={() => {
              setHidden(false)
            }}
            muted={!controls}
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
