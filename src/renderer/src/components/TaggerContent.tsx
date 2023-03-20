import clsx from 'clsx'
import {HTMLAttributes, useState} from 'react'
import {Content} from 'src/main/src/db/models'

const TaggerContent = ({
  content,
  contentProps,
  className,
  ...props
}: {
  content: Content
  contentProps?: HTMLAttributes<HTMLImageElement | HTMLVideoElement>
} & HTMLAttributes<HTMLDivElement>) => {
  const video = content.extension == '.mp4' || content.extension == '.avi'
  const [hidden, setHidden] = useState(!video)
  const [prog, setProg] = useState(0)

  const uri = new URL('tagger://' + content?.paths[0]?.path || '').toString()

  return (
    <div
      {...props}
      className={clsx(
        'relative -z-20 overflow-clip transition-all',
        !hidden && video ? '' : '',
        hidden && !video
          ? 'animate-gradient_x bg-opacity-50 bg-gradient-to-r from-gray-600 to-gray-800 opacity-50'
          : '',
        className,
      )}
    >
      {!video ? (
        <>
          <img
            className={
              'absolute inset-auto -z-10 h-full w-full scale-150 object-contain opacity-75 blur-2xl'
            }
            src={uri}
          />
          <img
            {...contentProps}
            hidden={hidden}
            className={clsx(
              'mx-auto h-full object-contain transition-all',
              contentProps?.className,
            )}
            onLoad={() => {
              setHidden(false)
            }}
            src={uri}
          />
        </>
      ) : (
        <video
          {...contentProps}
          className={clsx(
            'relative mx-auto h-full object-contain transition-all',
            className,
          )}
          src={uri}
          muted={true}
          onProgress={(evt) => {
            setProg(evt.timeStamp)
          }}
          onClick={(evt) => {
            const videoPlayer = evt.currentTarget
            videoPlayer.paused ? videoPlayer.play() : videoPlayer.pause()
            videoPlayer.muted
              ? (videoPlayer.muted = true)
              : (videoPlayer.muted = false)
          }}
          onMouseOut={(evt) => {
            evt.currentTarget.pause()
          }}
          onMouseEnter={(evt) => {
            if (evt.currentTarget.paused) {
              evt.currentTarget.play()
            }
          }}
        >
          <span className='right-0 bottom-0 bg-red-500 font-mono'>
            T:{prog}
          </span>
        </video>
      )}
      {props.children}
    </div>
  )
}

export {TaggerContent}
