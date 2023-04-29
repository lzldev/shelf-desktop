import {type HTMLAttributes, useRef, useMemo} from 'react'
import clsx from 'clsx'
import {InlineButton} from './components/InlineButton'
import {Pencil, PlusSign} from './components/Icons'
import {Updater, useImmer} from 'use-immer'
import {CREATETagOP, TagOperation, UpdateTagOP} from 'src/types/Operations'
import {Tag} from 'src/main/src/db/models'
import {useColors} from './hooks/useColors'
import {useTagQuery} from './hooks/useTagQuery'
import {useHotkeys} from './hooks/useHotkeys'
import {SidePanelModal} from './components/SidebarPanelModal'

const TagColorBody = clsx(
  'relative text-white z-10 m-1 flex group flex-row items-center justify-between rounded-full bg-[--bgColor] py-3 px-6 outline ring-2 ring-inset ring-white ring-opacity-50',
)

function EditTags({
  onClose,
  ...props
}: {
  onClose: (...any: any[]) => any
} & HTMLAttributes<HTMLDivElement>): JSX.Element {
  const modalRef = useRef<HTMLDivElement>(null)
  const {query, setQuery, foundTags: tags} = useTagQuery()
  const {colors} = useColors()
  const [operations, setOperations] = useImmer<Map<number, TagOperation>>(
    new Map(),
  )
  const [newTagOperations, setNewTagOperations] = useImmer<CREATETagOP[]>([])

  const ColorOptions = useMemo(() => {
    const options = new Array<JSX.Element>()

    options.push(<option value={-1}>Default Color</option>)

    options.push(
      ...Array.from(colors.values()).map((color, idx) => (
        <option
          key={idx}
          value={color.id}
        >
          {color.name}
        </option>
      )),
    )

    return options
  }, [colors])

  useHotkeys({
    Escape: onClose,
  })

  return (
    <SidePanelModal
      onClose={onClose}
      ref={modalRef}
    >
      <div className='mb-2 flex flex-row'>
        <input
          className='grow p-2'
          type='text'
          placeholder='Search'
          value={query}
          onChange={(evt) => {
            setQuery(evt.target.value)
          }}
        />
        <div className='flex items-center justify-between'>
          {(operations.size > 0 || newTagOperations.length > 0) && (
            <InlineButton
              onClick={() => {
                window.api
                  .invokeOnMain('editTags', [
                    ...operations.values(),
                    ...newTagOperations,
                  ])
                  .then(onClose)
              }}
            >
              Apply
            </InlineButton>
          )}
        </div>
      </div>

      <div className='flex w-full grow flex-col overflow-x-hidden'>
        <div
          className='group/newButton z-10 m-1 flex flex-row items-center rounded-full bg-slate-400 p-3 text-center font-bold text-white outline ring-inset ring-gray-400 backdrop-contrast-200 hover:bg-clip-text hover:text-transparent hover:ring-2'
          onClick={() => {
            setNewTagOperations((nc) => {
              nc.push({
                operation: 'CREATE',
                name: 'name',
                parentOnly: false,
                colorId: -1,
              })
            })
          }}
        >
          <PlusSign className='h-10 w-10 group-hover/newButton:stroke-gray-400' />
          <span className='ml-5 line-clamp-1 flex w-full flex-row overflow-hidden text-ellipsis'>
            Create Tag
          </span>
        </div>
        {newTagOperations.map((newTag, idx) => (
          <NewTagItem
            key={idx}
            idx={idx}
            newTag={newTag}
            setNewTagOperations={setNewTagOperations}
            ColorOptions={ColorOptions}
          />
        ))}
        {tags.map((tag, idx) => (
          <EditTagItem
            key={idx}
            tag={tag}
            options={ColorOptions}
            operation={operations.get(tag.id)}
            setOperations={setOperations}
          />
        ))}
      </div>
    </SidePanelModal>
  )
}

export {EditTags}

const EditTagItem = ({
  tag,
  operation,
  options,
  setOperations,
  ...props
}: {
  tag: Tag
  operation?: TagOperation
  options: JSX.Element[]
  setOperations: Updater<Map<number, TagOperation>>
} & HTMLAttributes<HTMLDivElement>) => {
  const {colors, defaultColor} = useColors()

  const body = useMemo(
    () =>
      !operation ? (
        NoOperation(tag, setOperations)
      ) : operation.operation === 'UPDATE' ? (
        UpdateOperation(operation, setOperations, tag, options)
      ) : operation.operation === 'DELETE' ? (
        DeleteOperation(setOperations, tag)
      ) : (
        <></>
      ),
    [operation],
  )

  const bgColor =
    colors.get(operation?.colorId || tag.colorId)?.color || defaultColor.color

  return (
    <div
      style={
        {
          '--bgColor': bgColor,
        } as React.CSSProperties
      }
      className={clsx(TagColorBody)}
    >
      {body}
    </div>
  )
}

function NewTagItem({
  ColorOptions,
  idx,
  newTag,
  setNewTagOperations,
}: {
  idx: number
  newTag: {
    operation: 'CREATE'
    colorId: number
    name: string
    parentOnly: boolean
  }
  setNewTagOperations: Updater<
    {operation: 'CREATE'; colorId: number; name: string; parentOnly: boolean}[]
  >
  ColorOptions: JSX.Element[]
}): JSX.Element {
  const {colors, defaultColor} = useColors()
  const bgColor = colors.get(newTag.colorId)?.color || defaultColor.color
  return (
    <div
      key={idx}
      style={
        {
          '--bgColor': bgColor,
        } as React.CSSProperties
      }
      className={clsx(TagColorBody)}
    >
      <div className='w-full flex-col'>
        <div className='flex flex-row'>
          <input
            type='text'
            spellCheck={false}
            className='ml-2.5 flex grow bg-transparent'
            value={newTag.name}
            onChange={(evt) => {
              setNewTagOperations((nc) => {
                nc[idx].name = evt.target.value || ''
              })
            }}
          />
          <InlineButton
            onClick={() => {
              setNewTagOperations((nc) => {
                nc.splice(idx, 1)
              })
            }}
          >
            X
          </InlineButton>
        </div>
        <div className='flex flex-row justify-between space-x-5 pr-5'>
          <div className='flex flex-row'>
            <label className='self-center text-center align-middle'>
              Parent Only:
            </label>
            <input
              className='ml-1 self-center text-center align-middle'
              type='checkbox'
              spellCheck={false}
              checked={newTag.parentOnly}
              onChange={(evt) => {
                setNewTagOperations((nc) => {
                  nc[idx].parentOnly = evt.target.checked
                })
              }}
            />
          </div>
          <select
            value={newTag.colorId}
            className='grow text-black'
            onChange={(evt) => {
              evt.target.dataset.value = evt.target.value
              setNewTagOperations((nc) => {
                nc[idx].colorId = parseInt(evt.target.value)
              })
            }}
          >
            <>{ColorOptions}</>
          </select>
        </div>
      </div>
    </div>
  )
}

function DeleteOperation(
  setOperations: Updater<Map<number, TagOperation>>,
  tag: Tag,
): any {
  return (
    <span
      className='flex h-full w-full opacity-0 transition-opacity group-hover:opacity-50'
      onClick={() => {
        setOperations((ops) => {
          ops.delete(tag.id)
        })
      }}
    >
      undo
    </span>
  )
}

function UpdateOperation(
  operation: {
    operation: 'UPDATE'
    id: number
    colorId: number
  } & import('d:/projetos/tagger/tagger-desktop-app/src/main/src/db/models/Tag').TagCreationFields,
  setOperations: Updater<Map<number, TagOperation>>,
  tag: Tag,
  options: JSX.Element[],
): any {
  return (
    <>
      <div className='flex w-full flex-col items-stretch'>
        <div className='flex w-full flex-row justify-between'>
          <input
            className='z-10 flex grow bg-transparent'
            type='text'
            spellCheck={false}
            value={operation.name}
            onChange={(evt) => {
              evt.target.dataset.value = evt.target.value
              setOperations((ops) => {
                ;(ops.get(tag.id) as UpdateTagOP).name = evt.target.value
              })
            }}
          />

          <div className='flex items-center justify-self-end'>
            <Pencil className='mr-2 flex stroke-white' />
            <InlineButton
              className='justify-self-end'
              onClick={() => {
                setOperations((ops) => {
                  ops.delete(tag.id)
                })
              }}
            >
              X
            </InlineButton>
          </div>
        </div>
        <div className='flex flex-row justify-between space-x-5 pr-5'>
          <div className='flex flex-row'>
            <label className='self-center text-center align-middle'>
              Parent Only:
            </label>
            <input
              className='ml-1 self-center text-center align-middle'
              type='checkbox'
              spellCheck={false}
              value={operation.name}
              onChange={(evt) => {
                evt.target.dataset.value = evt.target.value
                setOperations((ops) => {
                  ;(ops.get(tag.id) as UpdateTagOP).parentOnly =
                    evt.target.checked
                })
              }}
            />
          </div>
          <select
            value={operation.colorId}
            className='grow text-black'
            onChange={(evt) => {
              evt.target.dataset.value = evt.target.value
              setOperations((ops) => {
                ;(ops.get(tag.id) as UpdateTagOP).colorId = parseInt(
                  evt.target.value || '-1',
                )
              })
            }}
          >
            <>{options}</>
          </select>
        </div>
      </div>
    </>
  )
}

function NoOperation(
  tag: Tag,
  setOperations: Updater<Map<number, TagOperation>>,
): any {
  return (
    <>
      <div className='flex grow overflow-hidden text-ellipsis'>{tag.name}</div>
      <div className='flex flex-row'>
        <InlineButton
          onClick={() => {
            setOperations((operations) => {
              operations.set(tag.id, {
                operation: 'UPDATE',
                id: tag.id,
                colorId: tag.colorId || -1,
                ...tag,
              })
            })
          }}
        >
          EDIT
        </InlineButton>
        <InlineButton
          onClick={() => {
            setOperations((operations) => {
              operations.set(tag.id, {
                operation: 'DELETE',
                id: tag.id,
              })
            })
          }}
        >
          X
        </InlineButton>
      </div>
    </>
  )
}
