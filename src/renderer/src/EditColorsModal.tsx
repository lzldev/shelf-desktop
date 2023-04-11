import {type HTMLAttributes, useRef} from 'react'
import clsx from 'clsx'
import {useColors} from './hooks/useColors'
import {ModalBackDrop} from './components/ModalBackdrop'
import {InlineButton} from './components/InlineButton'
import {Pencil, PlusSign} from './components/Icons'
import {Updater, useImmer} from 'use-immer'
import type {TagColor} from 'src/main/src/db/models/TagColor'
import {
  CREATEColorOP,
  ColorOperation,
  UpdateColorOP,
} from 'src/types/Operations'

const TagColorBody = clsx(
  'relative z-10 m-1 flex flex-row items-center justify-between rounded-full bg-[--testColor] py-1.5 pl-5  pr-3 text-white text-opacity-90 outline ring-gray-500',
)

function EditColorsModal({
  onClose,
  ...props
}: {
  onClose: (...any: any[]) => any
} & HTMLAttributes<HTMLDivElement>): JSX.Element {
  const containerClass = clsx(props.className)
  const modalRef = useRef<HTMLDivElement>(null)
  const {colors} = useColors()
  const [operations, setOperations] = useImmer<Map<number, ColorOperation>>(
    new Map(),
  )
  const [newColorOperations, setNewColorOperations] = useImmer<CREATEColorOP[]>(
    [],
  )

  return (
    <div
      ref={modalRef}
      {...props}
      id={'taggerModal'}
      className={clsx(containerClass, 'text-6 fixed inset-0 z-50 flex w-full')}
      tabIndex={-1}
    >
      <ModalBackDrop onClick={onClose} />
      <div className='mx-auto flex h-2/3 w-1/2 flex-col self-center bg-slate-100 p-5 transition-all xl:w-1/3'>
        <div className='flex items-center justify-between'>
          <h1 className='text-6xl'>EDIT COLORS</h1>
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
          {Array.from(colors.values()).map((color) => (
            <EditableColorItem
              key={color.id}
              tagColor={color}
              operation={operations.get(color.id)}
              setOperations={setOperations}
            />
          ))}
          {newColorOperations.map((newColor, idx) => {
            return (
              <div
                key={idx}
                style={
                  {
                    '--bgColor': newColor.color || '',
                  } as React.CSSProperties
                }
                className={clsx(TagColorBody)}
              >
                <input
                  type='text'
                  spellCheck={false}
                  className='ml-2.5 flex bg-clip-text invert'
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
          <div
            className='z-10 m-1 flex flex-row items-center rounded-full bg-slate-400 p-3 text-center text-white text-opacity-90 outline backdrop-contrast-200 transition-all hover:bg-clip-text hover:text-transparent'
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
            <PlusSign className='h-16 w-16' />
            <a className='ml-5 line-clamp-1 flex w-full flex-row overflow-hidden text-ellipsis'>
              NEW COLOR
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export {EditColorsModal}

const EditableColorItem = ({
  tagColor,
  operation,
  setOperations,
  ...props
}: {
  tagColor: TagColor
  operation?: ColorOperation
  setOperations: Updater<Map<number, ColorOperation>>
} & HTMLAttributes<HTMLDivElement>) => {
  {
    let body
    if (!operation) {
      body = (
        <>
          <div className='flex overflow-hidden text-ellipsis text-opacity-90'>
            <a>{tagColor.name}</a>
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
                <Pencil className='mr-2 flex stroke-white' />
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
        case 'DELETE': {
          body = (
            <span
              className='flex h-full w-full opacity-0 hover:opacity-50'
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
      }
    }
    return (
      <div
        style={
          {
            '--testColor': operation?.color || tagColor.color,
          } as React.CSSProperties
        }
        className={clsx(TagColorBody)}
      >
        {body}
      </div>
    )
  }
}
