import {useConfigStore} from '../hooks/useConfig'
import {checkExtension} from '../utils/Extensions'
import clsx from 'clsx'
import {HTMLAttributes, useEffect, useState} from 'react'
import {DocumentIcon} from '@heroicons/react/24/solid'
import {usePreviewListener, PREVIEW_LISTENER} from '../hooks/usePreviewStore'
import {ListedContent} from 'src/main/db/ContentControllers'

type ContentPreviewProps = {
  content: ListedContent
  contentProps?: HTMLAttributes<HTMLDivElement> &
    HTMLAttributes<HTMLVideoElement>
} & HTMLAttributes<HTMLDivElement>

function ContentPreview({
  content,
  contentProps,
  ...containerProps
}: ContentPreviewProps) {
  const [error, setError] = useState<string | null>(null)

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

    const effect = async () => {
      const path = content?.path
      if (!path || format === 'unrecognized') {
        return
      }

      const response = await window.api
        .invokeOnMain(
          'preview_content',
          {
            hash: content.hash,
            filePath: path,
          },
          format,
        )
        .catch((error) => {
          console.error('Error on preview_content\n', error)
        })

      if (!response || response.instaError) {
        return
      }

      register(content.hash, listener)

      return () => {
        unregister(content.hash)
      }
    }

    effect()

    return () => {}
  }, [error])

  const thumbnailPath = useConfigStore((s) => s.config!.thumbnailPath)
  const uri = 'file://' + thumbnailPath + content.hash + '.jpg'

  return (
    <div
      {...containerProps}
      className={clsx(
        'relative overflow-clip',
        !hidden && format === 'video' ? '' : '',
        hidden && format === 'image'
          ? 'animate-gradient_x_fast bg-gradient-to-r from-gray-400 to-gray-800 opacity-50 duration-2500'
          : '',
        containerProps.className,
      )}
    >
      {(format === 'image' || format === 'video') && !error ? (
        <ContentThumbnail
          {...{format, uri, error, hidden, setError, setHidden}}
        />
      ) : (
        <GenericPreview {...{content, error, uri}} />
      )}
      {containerProps.children}
    </div>
  )
}

type ContentThumbnailProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  hidden: boolean
  uri: string
  setError: (value: string) => any
  setHidden: (value: boolean) => any
}

function ContentThumbnail({
  setHidden,
  setError,
  hidden,
  uri,
  ...props
}: ContentThumbnailProps) {
  return (
    <>
      <img
        {...props}
        src={uri}
        hidden={hidden}
        height={300}
        className={'absolute inset-0 h-full w-full object-contain'}
        onLoad={() => {
          setHidden(false)
        }}
        onError={(evt) => {
          setError(`ERROR LOADING PREVIEW ${evt.type} Loading Image`)
          setHidden(false)
        }}
      />
      <img
        className={
          'pointer-events-none absolute inset-0 -z-10 max-w-none scale-150 transform-gpu blur-3xl'
        }
        height={300}
        src={uri}
      />
    </>
  )
}

type SubComponentProps = ContentPreviewProps & {
  error: string | null
  uri: string
}

function GenericPreview({content, error, uri}: SubComponentProps) {
  return (
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
  )
}

export {ContentPreview}
