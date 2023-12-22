import {type HTMLAttributes, useRef} from 'react'
import clsx from 'clsx'
import {useColors} from './hooks/useColors'
import {InlineButton} from './components/InlineButton'
import {Updater, useImmer} from 'use-immer'
import {
  CreateColorOP,
  ColorOperation,
  UpdateColorOP,
} from 'src/types/Operations'
import {useHotkeys} from './hooks/useHotkeys'
import {SidePanelModal} from './components/SidebarPanelModal'
import {PencilSquareIcon, PlusIcon} from '@heroicons/react/24/solid'

const TagColorBody = clsx(
  'relative z-10 m-1 group flex flex-row items-center justify-between rounded-full bg-[--bgColor] py-1.5 pl-5  pr-3 text-white text-opacity-90 outline ring-2 ring-inset ring-white ring-opacity-40',
)

function EditColors({
  onClose,
}: {
  onClose: (...any: any[]) => any
} & HTMLAttributes<HTMLDivElement>): JSX.Element {
  const modalRef = useRef<HTMLDivElement>(null)
  const {colors} = useColors()
  const [operations, setOperations] = useImmer<Map<number, ColorOperation>>(
    new Map(),
  )
  const [newColorOperations, setNewColorOperations] = useImmer<CreateColorOP[]>(
    [],
  )

  useHotkeys({
    Escape: onClose,
  })

  return (
    <SidePanelModal
      className='w-fit min-w-[26rem] max-w-[80%]'
      onClose={onClose}
      ref={modalRef}
    >
      <div className='flex flex-row-reverse items-center justify-between'>
        {(operations.size > 0 || newColorOperations.length > 0) && (
          <InlineButton
            onClick={() => {
              window.api
                .invokeOnMain('editColors', [
                  ...operations.values(),
                  ...newColorOperations,
                ])
                .then((r) => {
                  if (r) {
                    onClose()
                  }
                })
            }}
          >
            Apply
          </InlineButton>
        )}
      </div>
      <div className='flex w-full grow flex-col overflow-x-hidden'>
        <div
          className='z-10 m-1 flex flex-row items-center rounded-full bg-slate-400 p-3 text-center text-white text-opacity-90 outline backdrop-contrast-200 transition-all hover:bg-clip-text  hover:text-transparent'
          onClick={() => {
            setNewColorOperations((nc) => {
              nc.push({
                operation: 'CREATE',
                name: 'name',
                color: '#ffffff',
              })
            })
          }}
        >
          <PlusIcon className='h-8 w-8' />
          <span className='ml-5 line-clamp-1 flex w-full flex-row overflow-hidden text-ellipsis'>
            NEW COLOR
          </span>
        </div>
        {newColorOperations.map((newColor, idx) => {
          return (
            <div
              key={idx}
              style={
                {
                  '--bgColor': newColor.color,
                } as React.CSSProperties
              }
              className={TagColorBody}
            >
              <input
                type='text'
                spellCheck={false}
                className='ml-2.5 flex grow bg-transparent'
                value={newColor.name}
                onChange={(evt) => {
                  setNewColorOperations((nc) => {
                    nc[idx].name = evt.target.value || ''
                  })
                }}
              />
              <input
                className='absolute inset-0 -z-10 flex h-full w-full cursor-pointer opacity-0'
                type='color'
                value={newColor.color}
                onChange={(evt) => {
                  setNewColorOperations((nc) => {
                    nc[idx].color = evt.target.value
                  })
                }}
              />
              <InlineButton
                onClick={() => {
                  setNewColorOperations((nc) => {
                    nc.splice(idx, 1)
                  })
                }}
              >
                X
              </InlineButton>
            </div>
          )
        })}
        {Array.from(colors.values()).map((color) => (
          <EditableColorItem
            key={color.id}
            tagColor={color}
            operation={operations.get(color.id)}
            setOperations={setOperations}
          />
        ))}
      </div>
    </SidePanelModal>
  )
}

export {EditColors}

const EditableColorItem = ({
  tagColor,
  operation,
  setOperations,
}: {
  tagColor: TagColor
  operation?: ColorOperation
  setOperations: Updater<Map<number, ColorOperation>>
} & HTMLAttributes<HTMLDivElement>) => {
  let body

  if (!operation) {
    body = (
      <>
        <div className='flex overflow-hidden text-ellipsis'>
          <span>{tagColor.name}</span>
        </div>
        <div className='flex flex-row'>
          <InlineButton
            onClick={() => {
              setOperations((operations) => {
                operations.set(tagColor.id, {
                  operation: 'UPDATE',
                  id: tagColor.id,
                  ...tagColor,
                })
              })
            }}
          >
            EDIT
          </InlineButton>
          <InlineButton
            onClick={() => {
              setOperations((operations) => {
                operations.set(tagColor.id, {
                  operation: 'DELETE',
                  id: tagColor.id,
                })
              })
            }}
          >
            X
          </InlineButton>
        </div>
      </>
    )
  } else {
    switch (operation.operation) {
      case 'UPDATE': {
        body = (
          <>
            <input
              className='z-10 flex bg-transparent'
              type='text'
              spellCheck={false}
              value={operation.name}
              onChange={(evt) => {
                evt.target.dataset.value = evt.target.value
                setOperations((ops) => {
                  ;(ops.get(tagColor.id) as UpdateColorOP).name =
                    evt.target.value
                })
              }}
            />
            <div className='flex items-center justify-self-end'>
              <PencilSquareIcon className='pointer-events-none z-10 mr-2 flex h-6 w-6 stroke-white' />
              <InlineButton
                className='justify-self-end'
                onClick={() => {
                  setOperations((ops) => {
                    ops.delete(tagColor.id)
                  })
                }}
              >
                X
              </InlineButton>
            </div>
            <input
              className='absolute inset-0 -z-10 flex h-full w-full cursor-pointer opacity-0'
              type='color'
              value={operation.color}
              onChange={(evt) => {
                setOperations((ops) => {
                  ;(ops.get(tagColor.id) as UpdateColorOP).color =
                    evt.target.value
                })
              }}
            />
          </>
        )
        break
      }
      case 'DELETE':
        {
          body = (
            <span
              className='flex h-full w-full opacity-0 transition-opacity group-hover:opacity-50'
              onClick={() => {
                setOperations((ops) => {
                  ops.delete(tagColor.id)
                })
              }}
            >
              undo
            </span>
          )
        }
        break
    }
  }

  return (
    <div
      style={
        {
          '--bgColor':
            !operation || operation.operation === 'DELETE'
              ? tagColor.color
              : operation.color ?? '#ff0000',
        } as React.CSSProperties
      }
      className={clsx(TagColorBody)}
    >
      {body}
    </div>
  )
}
