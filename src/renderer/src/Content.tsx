import {Content, Tag} from 'src/main/src/db/models'
import {useNavigate, useSearchParams} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {Query} from './Main'
import {useTags} from './hooks/useTags'
import {useState} from 'react'
import {InlineTag} from './components/InlineTag'

function App(): JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {tags} = useTags()
  //REMOVEME:
  const [selected] = useState(new Set<Tag>())
  const [showQuery, setShowQuery] = useState(false)

  const fetchImage = async () => {
    const id = searchParams.get('id')

    if (id === null) {
      throw 'Invalid ID in search Params '
    }
    const result = await window.api.invokeOnMain(
      'getDetailedImage',
      parseInt(id),
    )

    if (!result) {
      throw 'Invalid Image'
    }

    return result
  }

  const {
    data: content,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['DetailedContent'],
    queryFn: fetchImage,
  })

  if (isLoading) {
    return (
      <div className='flex h-screen w-screen'>
        <h1 onClick={() => navigate({pathname: '/'})}>
          LOADING - {searchParams}
        </h1>
        <h1 onClick={() => navigate('/')}>{window.location.toString()}</h1>
      </div>
    )
  }

  if (!content || error) {
    return (
      <div className='flex h-screen w-screen'>
        <h1 onClick={() => navigate({pathname: '/'})}>{'ERROR -> ' + error}</h1>
      </div>
    )
  }

  return (
    <div className={'max-w-screen min-h-screen w-full overflow-y-hidden p-10'}>
      <h1
        className='text-6xl font-bold'
        onClick={() => navigate({pathname: '/'})}
      >
        {'BACK'}
      </h1>
      <div className='relative overflow-hidden p-4'>
        <div className='flex w-full'>
          <TaggerContent content={content} />
        </div>
        <div className={'my-2 -mx-96 h-0.5 bg-white'}></div>
        <div className='relative'>
          <div className={'my-2'}>
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
          <div>
            {(content?.tags || []).map((tag) => {
              return (
                <InlineTag
                  key={tag.id}
                  tag={tag}
                />
              )
            })}
            {(content?.tags || []).map((tag) => {
              return (
                <InlineTag
                  key={tag.id}
                  tag={tag}
                />
              )
            })}
            {(content?.tags || []).map((tag) => {
              return (
                <InlineTag
                  key={tag.id}
                  tag={tag}
                />
              )
            })}
            <a
              className={
                'relative m-1 inline-flex animate-gradient_xy items-center rounded-full bg-gradient-to-tl from-fuchsia-400 to-cyan-400 p-1 text-xl font-bold text-opacity-90'
              }
              onClick={(evt) => {
                evt.clientX
                setShowQuery(true)
              }}
            >
              +
            </a>
          </div>
        </div>
      </div>
      <Query
        hidden={!showQuery}
        tags={tags}
        addSelected={(tag) => {
          setShowQuery(false)
          console.log(tag)

          window.api.invokeOnMain('addTagToContent', {
            contentId: content.id,
            tagId: tag.id,
          })
          //TODO:Add Tag to Content
        }}
        onQuery={() => {}}
        removeSelected={() => {}}
        selected={selected}
      />
    </div>
  )
}

const DropdownMenu = () => {
  return (
    <div
      className={
        'absolute right-0 bottom-0 z-10 mt-2 w-56 origin-bottom-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'
      }
      role='menu'
      aria-orientation='vertical'
      aria-labelledby='menu-button'
      tabIndex={-1}
    >
      {/* 
      //TODO: Add a Tags popup with portals.
      <div
        className='py-1'
        role='none'
      >
        <a
          href='#'
          className='block px-4 py-2 text-sm text-gray-700'
          role='menuitem'
          tabIndex={-1}
          id='menu-item-0'
        >
          Account settings
        </a>
        <a
          href='#'
          className='block px-4 py-2 text-sm text-gray-700'
          role='menuitem'
          tabIndex={-1}
          id='menu-item-1'
        >
          Support
        </a>
        <a
          href='#'
          className='block px-4 py-2 text-sm text-gray-700'
          role='menuitem'
          tabIndex={-1}
          id='menu-item-2'
        >
          License
        </a>
        <form
          className=''
          role='none'
        >
          <button
            className='block w-full px-4 py-2 text-left text-sm text-gray-700'
            role='menuitem'
            tabIndex={-1}
            id='menu-item-3'
          >
            Sign out
          </button>
        </form>
      </div> 
      */}
    </div>
  )
}

const TaggerContent = (props: {content: Content}) => {
  const {content} = props

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
      className='mx-auto h-96  bg-black bg-opacity-5 object-contain'
      src={'tagger://' + content.paths[0].path}
    />
  )
}
export default App
