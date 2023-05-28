import clsx from 'clsx'
import {HTMLAttributes, useRef, useState} from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const video = content.extension == '.mp4' || content.extension == '.avi'
  const [hidden, setHidden] = useState(!video)

  const uri = new URL('file://' + content?.paths[0]?.path || '').toString()

  return (
    <div
      {...props}
      ref={containerRef}
      className={clsx(
        'relative overflow-clip',
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
              'absolute inset-0 -z-10 h-full w-full scale-150 object-contain opacity-25 blur-2xl saturate-200'
            }
            src={uri}
          />
          <img
            {...contentProps}
            onLoad={(evt) => {
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
