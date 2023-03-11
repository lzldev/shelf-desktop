import Versions from './components/Versions'
import icons from './assets/icons.svg'
import { PropsWithChildren, useEffect, useState } from 'react'
import { useProgress } from './hooks/useProgress'
import { useTags } from './hooks/useTags'
import { Tag, Content } from 'src/main/src/db/models'

function App(): JSX.Element {
  const { tags } = useTags()
  const [files, setFiles] = useState<Content[]>([])
  const [selected, setSelected] = useState<Set<Tag>>(new Set())
  const [error, setError] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const getImages = async () => {
    setIsLoading(true)

    const tags = selected.size > 0 ? Array.from(selected.values()) : undefined

    const Files = await window.api
      .invokeOnMain('getTaggerImages', {
        tags,
      })
      .catch(setError)
    if (Files) {
      setFiles(() => Files)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    getImages()
  }, [])

  return (
    <Body>
      <Query
        tags={tags}
        selected={selected}
        onQuery={getImages}
        addSelected={(tag: Tag) => {
          setSelected((_selected) => {
            _selected.add(tag)
            return _selected
          })
        }}
        removeSelected={(tag: Tag) => {
          setSelected((_selected) => {
            const s = new Set(_selected)
            s.delete(tag)
            return s
          })
        }}
      />
      <div className='flex flex-wrap'>
        {isLoading ? (
          <h1 className='text-center text-9xl underline'>LOADING...</h1>
        ) : (
          files.map((value) => {
            if (!value.Paths || !value.Paths[0]) {
              return
            }
            return (
              <div key={value.id} className='w-1/3 flex-auto  p-4 '>
                {value.extension === '.mp4' ? (
                  <video
                    className='border-2 border-red-500'
                    src={'tagger://' + value.Paths[0].path}
                    muted={true}
                    onClick={(evt) => {
                      const videoPlayer = evt.currentTarget
                      videoPlayer.paused
                        ? videoPlayer.play()
                        : videoPlayer.pause()
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
                ) : (
                  <img src={'tagger://' + value.Paths[0].path} />
                )}
                <a className='truncate text-clip underline'>
                  {value.Paths[0].path}
                </a>
                <a className='truncate text-clip underline'>
                  {value.extension}
                </a>
              </div>
            )
          })
        )}
      </div>
    </Body>
  )
}

const Query = (props: {
  tags: Tag[]
  selected: Set<Tag>
  onQuery: (...any) => any
  addSelected: (Tag) => any
  removeSelected: (Tag) => any
}) => {
  const { tags, onQuery, addSelected, selected, removeSelected } = props
  const [query, setQuery] = useState<string>('')
  const selectedTags = Array.from(selected)
  const TransformedQuery = query?.split(' ')
  const hideDrop = !!TransformedQuery[TransformedQuery.length - 1]
  const DropTags = hideDrop
    ? tags.filter((tag) =>
        tag.name
          .toLowerCase()
          .includes(
            TransformedQuery[TransformedQuery.length - 1].toLowerCase(),
          ),
      )
    : []

  return (
    <>
      <form>
        <input
          className='w-[100%] flex-auto items-stretch self-stretch
           p-2 text-pink-500 outline-none 
           selection:bg-pink-200 hover:border-none active:border-none'
          type={'text'}
          value={query}
          list='tag-list'
          onChange={(evt) => {
            evt.preventDefault()
            setQuery(evt.target.value)
          }}
          onKeyDown={(evt) => {
            if (evt.key === 'Enter') {
              onQuery()
            }
          }}
        />
      </form>
      <div
        className={'absolute mx-auto self-center bg-white'}
        hidden={!hideDrop}
      >
        {DropTags.map((tag) => {
          return (
            <a
              key={tag.id}
              className='p2 mx-2 my-1 inline-block '
              onClick={() => {
                setQuery('')
                addSelected(tag)
              }}
            >
              {tag.name}
            </a>
          )
        })}
      </div>
      <div className='my-2'>
        {selectedTags.map((tag) => {
          return (
            <a
              key={tag.id}
              onClick={() => {
                removeSelected(tag)
              }}
              className='m-3 inline-block animate-gradient_xy rounded-full bg-gradient-to-tl from-fuchsia-400 to-cyan-400  p-4 text-white text-black text-opacity-80'
            >
              {tag.name}
            </a>
          )
        })}
      </div>
    </>
  )
}

const Body = (props: PropsWithChildren): JSX.Element => {
  const { progress } = useProgress()
  return (
    <div className='mx-auto w-4/5 overflow-hidden'>
      <Versions />
      <svg className='hero-logo' viewBox='0 0 900 300'>
        <use xlinkHref={`${icons}#electron`} />
      </svg>
      <h2
        className='unselectable text-center text-9xl uppercase'
        onSelect={() => false}
      >
        Tagger
        {progress}
      </h2>
      {props?.children || <></>}
    </div>
  )
}

export default App
