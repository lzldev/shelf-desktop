import {HTMLAttributes, PropsWithChildren, useState} from 'react'
import {useTags} from './hooks/useTags'
import {Tag, Content} from 'src/main/src/db/models'
import {createSearchParams, useNavigate} from 'react-router-dom'
import {useQuery} from '@tanstack/react-query'
import {InlineTag} from './components/InlineTag'
import {TaggerContent} from './components/TaggerContent'
import clsx from 'clsx'

function App(): JSX.Element {
  const {tags} = useTags()
  const [selected, setSelected] = useState<Set<Tag>>(new Set())
  const navigate = useNavigate()

  const getImages = async () => {
    const tags = selected.size > 0 ? Array.from(selected.values()) : undefined
    const Files = await window.api.invokeOnMain('getTaggerImages', {
      tags,
    })

    if (Files) {
      return Files
    }

    throw 'Content Not Found'
  }

  const {
    data: files,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['content'],
    queryFn: getImages,
  })

  return (
    <div
      className={clsx(
        'min-h-screen w-full  p-10',
        selected.size == 0 ? 'divide-y-2' : '',
      )}
    >
      <SearchBar
        tags={tags}
        selected={selected}
        onQuery={refetch}
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
      <Body
        isLoading={isLoading}
        error={error}
        className={
          'grid w-auto sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8'
        }
      >
        {(files || []).map((content) => {
          if (!content.paths || !content.paths[0]) {
            return
          }

          return (
            <div
              key={content.id}
              className={'flex min-h-[30vh] flex-col  overflow-clip p-4'}
              onClick={() => {
                navigate({
                  pathname: 'content',
                  search: createSearchParams({
                    id: content.id,
                  }).toString(),
                })
              }}
            >
              <TaggerContent
                content={content}
                className={'h-full w-full'}
              />
              <a className={'truncate'}>{content.paths[0].path}</a>
            </div>
          )
        })}
      </Body>
    </div>
  )
}

const Body = (
  props: {isLoading: boolean; error: unknown} & PropsWithChildren &
    HTMLAttributes<HTMLDivElement>,
) => {
  if (props.error) {
    return (
      <div {...props}>
        <h1 className='text-6xl'>{props.error.toString()}</h1>
      </div>
    )
  }
  return (
    <div className='grid sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8'>
      {props.isLoading ? <></> : props.children}
    </div>
  )
}

export const SearchBar = (props: {
  tags: Tag[]
  selected: Set<Tag>
  onQuery: () => any
  addSelected: (tag: Tag) => any
  removeSelected: (tag: Tag) => any
  hidden?: boolean
}) => {
  const {tags, onQuery, addSelected, selected, removeSelected} = props
  const [query, setQuery] = useState<string>('')
  const selectedTags = Array.from(selected)
  const TransformedQuery = query?.split(' ')
  const hideDrop = !!TransformedQuery[TransformedQuery.length - 1]
  const DropDownTags = hideDrop
    ? tags.filter((tag) =>
        tag.name
          .toLowerCase()
          .includes(
            TransformedQuery[TransformedQuery.length - 1].toLowerCase(),
          ),
      )
    : []

  if (props.hidden === true) {
    return <></>
  }

  return (
    <div className='relative'>
      <form
        className={
          'z-20 mb-5 flex w-full place-content-stretch overflow-clip rounded-full bg-white pl-2 ring-2 ring-pink-500'
        }
      >
        <input
          className={
            ' z-20 w-full bg-transparent p-2 text-pink-500 outline-none selection:bg-pink-200 hover:border-none active:border-none'
          }
          type={'text'}
          value={query}
          list='tag-list'
          onChange={(evt) => {
            setQuery(evt.target.value)
          }}
          onSubmit={(evt) => {
            evt.preventDefault()
            evt.stopPropagation()
          }}
          onKeyDown={(evt) => {
            if (evt.key === 'Enter') {
              onQuery()
            }
          }}
        />
        <button
          className={
            'z-20 bg-gradient-to-r from-pink-500 to-cyan-600 bg-clip-text px-10 font-bold text-transparent text-gray-700 ring-gray-300 transition-all hover:bg-clip-border hover:text-white hover:ring-0'
          }
          onClick={onQuery}
        >
          Search
        </button>
      </form>

      <div
        className={
          'absolute top-10 -right-0.5 -left-0.5 z-10 -mt-5 h-auto origin-top border-x-2 border-b-2 border-pink-500 bg-white pt-6'
        }
        hidden={!hideDrop || DropDownTags.length === 0}
      >
        {DropDownTags.map((tag) => {
          return (
            <a
              key={tag.id}
              className='p2 mx-2 my-1  inline-block
            font-mono text-gray-700 underline 
            decoration-pink-500 
            hover:decoration-fuchsia-700 hover:decoration-2'
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
      <div
        className='-mx-10 bg-gray-200 px-10 py-2'
        hidden={selectedTags.length === 0}
      >
        {selectedTags.map((tag) => {
          return (
            <InlineTag
              key={tag.id}
              tag={tag}
              onClick={() => removeSelected(tag)}
            />
          )
        })}
      </div>
    </div>
  )
}

export default App
