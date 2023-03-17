import {Tag} from 'src/main/src/db/models'
import {useNavigate, useSearchParams} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {SearchBar} from './Main'
import {useTags} from './hooks/useTags'
import {useState} from 'react'
import {InlineTag} from './components/InlineTag'
import {TaggerContent} from './components/TaggerContent'

function App(): JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {tags} = useTags()
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
    refetch,
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
    <div>
      <div className='my-5 flex justify-between px-5'>
        <h1
          className='font-mono text-6xl font-extrabold'
          onClick={() => window.history.back()}
        >
          {'<-'}
        </h1>
      </div>
      <div>
        <TaggerContent
          content={content}
          className={'h-[60vh]'}
        />
      </div>
      <div className='relative overflow-hidden p-4'>
        <div className='relative'>
          <div className={'my-2'}>
            {(content?.paths || []).map((p, idx) => {
              return (
                <p
                  key={idx}
                  className='trucate selectable overflow-hidden font-mono font-medium selection:bg-fuchsia-400'
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
            <a
              onClick={(evt) => {
                evt.clientX
                setShowQuery(true)
              }}
              className={
                'ml-1 inline-flex animate-gradient_xy_fast rounded-full border-2 bg-gradient-to-tr from-fuchsia-400 via-cyan-400 to-green-400 p-1 px-1.5 text-center text-xl font-bold text-white text-opacity-90 backdrop-contrast-200 transition-all hover:bg-clip-text hover:text-transparent'
              }
            >
              +
            </a>
          </div>
        </div>
      </div>
      <SearchBar
        hidden={!showQuery}
        tags={tags}
        addSelected={async (tag) => {
          setShowQuery(false)

          const tagCreated = await window.api.invokeOnMain('addTagToContent', {
            contentId: content.id,
            tagId: tag.id,
          })

          if (tagCreated) {
            refetch()
          }
        }}
        onQuery={() => {}}
        removeSelected={() => {}}
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
export default App
