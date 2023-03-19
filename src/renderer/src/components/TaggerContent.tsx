import clsx from 'clsx'
import {HTMLAttributes, useEffect, useMemo, useState} from 'react'
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
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    if (content.paths.length === 0) {
      setHidden(true)
    }
  }, [content])

  const uri = new URL('tagger://' + content?.paths[0]?.path || '').toString()
  const video = content.extension == '.mp4' || content.extension == '.avi'

  return (
    <div
      {...props}
      className={clsx(
        'relative -z-20 overflow-clip transition-all',
        hidden
          ? 'animate-gradient_x bg-gradient-to-r from-gray-600 to-gray-500 opacity-50'
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
            'mx-auto h-full object-contain transition-all',
            className,
          )}
          src={uri}
          muted={true}
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
        />
      )}
      {props.children}
    </div>
  )
}

export {TaggerContent}
