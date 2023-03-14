import clsx from 'clsx'
import {HTMLAttributes, useState} from 'react'
import {Content} from 'src/main/src/db/models'

const TaggerContent = (
  props: {
    content: Content
    contentAttributes?: HTMLAttributes<HTMLImageElement | HTMLVideoElement>
  } & HTMLAttributes<HTMLDivElement>,
) => {
  const [hidden, setHidden] = useState(true)

  return (
    <div
      {...props}
      className={clsx(
        'relative -z-20 overflow-clip transition-all',
        hidden
          ? 'animate-gradient_x bg-gradient-to-r from-gray-600 to-gray-500 opacity-50'
          : '',
        props.className,
      )}
    >
      <img
        className='absolute inset-auto -z-10 h-full w-full scale-150 object-contain blur-2xl'
        src={'tagger://' + props.content.paths[0].path}
      />
      {props.content.extension !== '.mp4' ? (
        <img
          {...props.contentAttributes}
          hidden={hidden}
          className={clsx(
            'mx-auto h-full object-contain transition-all',
            props.contentAttributes?.className,
          )}
          onLoad={() => {
            setHidden(false)
          }}
          src={'tagger://' + props.content.paths[0].path}
        />
      ) : (
        <video
          {...props.contentAttributes}
          className={clsx(props.className, '')}
          src={'tagger://' + props.content.paths[0].path}
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
    </div>
  )
}

export {TaggerContent}
