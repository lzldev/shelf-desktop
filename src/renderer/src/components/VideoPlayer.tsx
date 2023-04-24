function VideoPlayer(
  props: any,
  contentProps: HTMLAttributes<HTMLImageElement | HTMLVideoElement> | undefined,
  uri: string,
) {
  const [prog, setProg] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [headPos, setHeadPos] = useState(0)

  useHotkeys({
    space: () =>
      videoRef.current?.paused
        ? videoRef.current?.play()
        : videoRef.current?.pause(),
  })

  return (
    <div
      className={clsx(
        'group/player relative h-full object-contain',
        props.className,
      )}
    >
      <video
        {...contentProps}
        className='h-full w-full object-contain'
        src={uri}
        ref={videoRef}
        muted={true}
        onTimeUpdate={(evt) => {
          setProg(evt.currentTarget.currentTime)
        }}
        onClick={(evt) => {
          const videoPlayer = evt.currentTarget
          videoPlayer.paused ? videoPlayer.play() : videoPlayer.pause()
          videoPlayer.muted
            ? (videoPlayer.muted = true)
            : (videoPlayer.muted = false)
        }}
      ></video>

      <div className='absolute bottom-0 flex w-full translate-y-full flex-row bg-black bg-opacity-50 px-10 text-white transition-transform group-hover/player:translate-y-0'>
        <span
          className='pointer-events-auto font-mono transition-colors hover:bg-red-500'
          onClick={(evt) => {
            evt.stopPropagation()
            if (videoRef.current!.paused) {
              videoRef.current!.play()
            } else {
              videoRef.current!.pause()
            }
          }}
        >
          Play
        </span>
        <div
          className='relative flex w-full bg-gray-100 bg-opacity-10'
          onClick={(evt) => {
            evt.stopPropagation()
            const divRect = evt.currentTarget.getBoundingClientRect()
            const clickPercent = (evt.clientX - divRect.left) / divRect.width
            videoRef.current!.currentTime =
              videoRef.current!.duration * clickPercent
          }}
          onMouseMove={(evt) => {
            evt.currentTarget.getBoundingClientRect()
            const divRect = evt.currentTarget.getBoundingClientRect()
            const clickPercent =
              ((evt.clientX - divRect.left) / divRect.width) * 100

            console.log(
              'p ->',
              (prog / (videoRef.current?.duration || 0)) * 100,
            )

            setHeadPos(clickPercent)
          }}
          onMouseLeave={() => {
            setHeadPos(-100)
          }}
        >
          <div
            className='absolute inset-0 -z-10 bg-red-500 bg-opacity-50'
            style={{
              width: `${(prog / (videoRef.current?.duration || 0)) * 100}%`,
            }}
          ></div>
          <div
            className='absolute h-full w-1 bg-white'
            style={{
              left: `${headPos}%`,
            }}
          ></div>
        </div>
        VIDEO PLAYER FOOTER
      </div>

      <span className='absolute inset-1/2 z-20 font-mono text-white text-opacity-100'>
        P:{prog}
      </span>
    </div>
  )
}
