import {useConfigStore} from '../hooks/useConfig'
import {Content} from '@models'
import {checkExtension} from '../utils/Extensions'
import clsx from 'clsx'
import {HTMLAttributes, useEffect,  useState} from 'react'
import {DocumentIcon} from '@heroicons/react/24/solid'
import {usePreviewListener, PREVIEW_LISTENER} from '../hooks/usePreviewStore'

type ContentPreviewProps = {
  content: Content
  contentProps?: HTMLAttributes<HTMLDivElement> &
    HTMLAttributes<HTMLVideoElement>
} & HTMLAttributes<HTMLDivElement>

function ContentPreview({
  content,
  contentProps,
  ...props
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

    const async = async () => {
      const path = content?.paths?.at(0)?.path
      if (!path || format === 'unrecognized') {
        return
      }

      const response = await window.api.invokeOnMain('preview_content', {
        hash: content.hash,
        filePath: path,
      },format)

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

  const uri = 'file://' + thumbnailPath + content.hash + '.jpg'

  return (
    <div
      {...props}
      className={clsx(
        'relative overflow-clip',
        !hidden && format === 'video' ? '' : '',
        hidden && format === 'image'
          ? 'animate-gradient_x_fast bg-gradient-to-r from-gray-400 to-gray-800 opacity-50 duration-2500'
          : '',
        props.className,
      )}
    >
      {(format === 'image' || format === 'video') && !error ? (
        <ContentThumbnail
          {...{format, uri, error, hidden, setError, setHidden}}
        />
      ) : (
        <GenericPreview {...{content, error, uri}} />
      )}
      {props.children}
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
        className={
          'absolute inset-0 -z-10 h-full w-full scale-150 object-contain opacity-25 blur-2xl saturate-200'
        }
        src={uri}
      />
      <img
        {...props}
        src={uri}
        hidden={hidden}
        className={clsx('mx-auto h-full object-contain ', props?.className)}
        onLoad={() => {
          setHidden(false)
        }}
        onError={(evt) => {
          setError(`ERROR LOADING PREVIEW ${evt.type} Loading Image`)
          setHidden(false)
        }}
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
