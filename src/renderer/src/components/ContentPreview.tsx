import {useConfigStore} from '../hooks/useConfig'
import {Content} from '@models'
import {checkExtension} from '../utils/Extensions'
import clsx from 'clsx'
import {HTMLAttributes, useEffect, useRef, useState} from 'react'
import {DocumentIcon} from '@heroicons/react/24/solid'
import {usePreviewListener, PREVIEW_LISTENER} from '../hooks/usePreviewStore'

type ContentPreviewProps = {
  content: Content
  controls?: boolean
  contentProps?: HTMLAttributes<HTMLDivElement> &
    HTMLAttributes<HTMLVideoElement>
} & HTMLAttributes<HTMLDivElement>

function ContentPreview({
  content,
  contentProps,
  controls,
  ...props
}: ContentPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const previewRef = useRef<HTMLImageElement>(null)

  const format = checkExtension(content.extension)
  const [hidden, setHidden] = useState(format === 'image')

  const {register, unregister} = usePreviewListener()

  useEffect(() => {
    if (!error) {
      return
    }

    const listener: PREVIEW_LISTENER = (data) => {
      if (!data.success && data.hash === content.hash) {
        unregister(content.hash)
        return
      }

      if (data.hash === content.hash) {
        setError(null)
      }

      unregister(content.hash)
    }

    const async = async () => {
      const path = content?.paths?.at(0)?.path
      if (!path) {
        return
      }

      const response = await window.api.invokeOnMain('preview_content', {
        hash: content.hash,
        filePath: path,
      })

      if (response.instaError) {
        return
      }

      register(content.hash, listener)

      return () => {
        unregister(content.hash)
      }
    }

    async()

    return () => {}
  }, [error])

  const thumbnailPath = useConfigStore((s) => s.config!.thumbnailPath)

  //TODO:MAKE THE FORMAT A CONST
  const uri = 'file://' + thumbnailPath + content.hash + '.jpg'

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
            src={uri}
            ref={previewRef}
            hidden={hidden}
            className={clsx(
              'mx-auto h-full object-contain ',
              contentProps?.className,
            )}
            onLoad={() => {
              setHidden(false)
            }}
            onError={(evt) => {
              setError(`ERROR LOADING PREVIEW ${evt.type} Loading Image`)
              setHidden(false)
            }}
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

export {ContentPreview}
