import clsx from 'clsx'
import {HTMLAttributes, useState} from 'react'
import {Content} from 'src/main/src/db/models'

function TaggerContent({
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
  const video = content.extension == '.mp4' || content.extension == '.avi'
  const [hidden, setHidden] = useState(!video)

  const uri = new URL('tagger://' + content?.paths[0]?.path || '').toString()

  return (
    <div
      {...props}
      className={clsx(
        'relative overflow-clip transition-all',
        !hidden && video ? '' : '',
        hidden && !video
          ? 'animate-gradient_x bg-opacity-50 bg-gradient-to-r from-gray-600 to-gray-800 opacity-50'
          : '',
        props.className,
      )}
    >
      {!video ? (
        <>
          <img
            className={
              'absolute inset-auto -z-10 h-full w-full scale-150 object-contain opacity-75 blur-2xl saturate-200'
            }
            src={uri}
          />
          <img
            {...contentProps}
            hidden={hidden}
            className={clsx(
              'mx-auto h-full object-contain ',
              contentProps?.className,
            )}
            onLoad={() => {
              setHidden(false)
            }}
            src={uri}
          />
        </>
      ) : (
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
      )}
      {props.children}
    </div>
  )
}
export {TaggerContent}
