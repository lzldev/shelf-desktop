import { DocumentIcon } from '@heroicons/react/24/solid'
import { useConfigStore } from '@renderer/hooks/useConfig'
import { Content } from '@renderer/types/db'
import { checkFormat } from '@renderer/utils/formats'
import clsx from 'clsx'
import { HTMLAttributes, useEffect, useRef, useState } from 'react'

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

  const format = checkFormat(content.extension)
  const [hidden, setHidden] = useState(format === 'image')

  useEffect(() => {
    console.log(`Preview Effect`)
    const path = content?.paths?.at(0)?.path
    if (!path) {
      return
    }

    const response = await window.api.invokeOnMain('preview_content', {
      hash: content.hash,
      filePath: path,
    })

    return () => { }
  }, [error])

  const thumbnailPath = useConfigStore((s) => s.config!.thumbnailPath)
  const uri = 'file://' + thumbnailPath + content.hash

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
          {/* <img */}
          {/*   className={ */}
          {/*     'absolute inset-0 -z-10 h-full w-full scale-150 object-contain opacity-25 blur-2xl saturate-200' */}
          {/*   } */}
          {/*   src={uri} */}
          {/* /> */}
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
        <div className='flex relative w-full h-full'>
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
        <div className='flex flex-col justify-center items-center h-full overflow-clip'>
          <DocumentIcon className='w-8 h-8 fill-gray-300' />
          <span
            dir={!content.extension ? 'rtl' : undefined}
            className='mt-1 w-2/3 font-mono text-center text-gray-100 truncate'
          >
            {content.extension || uri}
          </span>
          {error && (
            <span
              dir={!content.extension ? 'rtl' : undefined}
              className='mt-1 w-2/3 font-mono text-center text-gray-100 truncate'
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
export { ContentPreview }
