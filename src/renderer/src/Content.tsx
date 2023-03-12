import { useEffect, useState } from 'react'
import { Content } from 'src/main/src/db/models'
import { useNavigate, useSearchParams } from 'react-router-dom'

function App(): JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [content, setContent] = useState<Content>()
  const [isLoading, setisLoading] = useState(true)
  const [error, setError] = useState<boolean>()
  const searchId = parseInt(searchParams.get('id') + '') || 0

  const fetchImage = async () => {
    const result = await window.api.invokeOnMain('getDetailedImage', searchId)
    if (!result) {
      setError(true)
      setisLoading(false)
      return
    }
    setContent(result)
    setisLoading(false)
  }
  useEffect(() => {
    fetchImage()
  }, [])

  if (isLoading) {
    return (
      <div className='flex h-screen w-screen'>
        <h1 onClick={() => navigate({ pathname: '/' })}>
          LOADING - {searchParams}
        </h1>
        <h1 onClick={() => navigate('/')}>{window.location.toString()}</h1>
      </div>
    )
  }

  if (!content || error) {
    return (
      <div className='flex h-screen w-screen'>
        <h1 onClick={() => navigate({ pathname: '/' })}>ERROR ----</h1>
      </div>
    )
  }

  return (
    <div className='max-w-screen overflow-hidden p-10'>
      <h1
        className='text-6xl font-bold'
        onClick={() => navigate({ pathname: '/' })}
      >
        {'BACK'}
      </h1>
      <div className='grid-flow-col overflow-hidden p-4'>
        <div className='w-full'>
          <TaggerContent content={content} />
          {(content?.paths || []).map((p, idx) => {
            return (
              <p
                key={idx}
                className='trucate overflow-hidden'
              >
                {p.path}
              </p>
            )
          })}
        </div>
        {(content?.tags || []).map((tag) => {
          return (
            <a
              key={tag.id}
              className='m-1 inline-block animate-gradient_xy rounded-full bg-gradient-to-tl
               from-fuchsia-400 to-cyan-400  p-1.5  font-bold text-opacity-90'
            >
              {tag.name}
            </a>
          )
        })}
      </div>
    </div>
  )
}

const TaggerContent = (props: { content: Content }) => {
  const { content } = props

  if (content.extension === '.mp4') {
    return (
      <video
        className='h-full border-2 border-red-500 bg-black bg-opacity-20 object-contain'
        src={'tagger://' + content.paths[0].path}
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
    )
  }

  return (
    <img
      className='h-full flex-auto bg-black bg-opacity-5 object-contain'
      src={'tagger://' + content.paths[0].path}
    />
  )
}
export default App
