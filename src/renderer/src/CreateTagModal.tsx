import {useNavigate} from 'react-router-dom'
import {HTMLAttributes, useRef, useState} from 'react'
import clsx from 'clsx'
import {InlineButton} from './components/InlineButton'
import {useColors} from './hooks/useColors'
import {ModalBackDrop} from './components/ModalBackdrop'
import {TagColorFields} from 'src/main/src/db/models/TagColor'

function CreateTagModal({
  onClose,
  ...props
}: {
  onClose: (...any: any[]) => any
} & HTMLAttributes<HTMLDivElement>): JSX.Element {
  const containerClass = clsx(props.className)
  const {colors} = useColors()
  const navigate = useNavigate()
  const modalRef = useRef<HTMLDivElement>(null)
  const [tagName, setTagName] = useState('')
  const [parentOnly, setParentOnly] = useState(false)
  const [color, setColor] = useState<number>(-1)

  const [colorNameTBR, setColorNameTBR] = useState<string>('')
  const [colorTBR, setColorTBR] = useState<string>('#000000')

  return (
    <div
      ref={modalRef}
      {...props}
      id={'taggerModal'}
      className={clsx(containerClass, 'text-6 fixed inset-0 z-50 flex w-full')}
      tabIndex={-1}
    >
      <ModalBackDrop onClick={onClose} />
      <div className='mx-auto h-2/3 w-1/2 self-center bg-slate-300 p-5'>
        <h1 className='text-6xl'>CREATE TAG</h1>
        <div className='flex flex-col'>
          <div className='flex flex-row py-2'>
            <input
              type='text'
              className='mr-1 grow'
              placeholder='Tag Name'
              value={tagName}
              onChange={(evt) => {
                evt.stopPropagation()
                setTagName(evt.target.value)
              }}
            />
            <label>ParentOnly:</label>
            <input
              className='ml-1 border-red-500 align-middle'
              type='checkbox'
              checked={parentOnly}
              onChange={(evt) => {
                setParentOnly(evt.target.checked)
              }}
            />
          </div>
          <div
            className='pointer-events-none relative z-10 p-3 py-4'
            style={{
              backgroundColor: colors.get(color)?.color || '',
            }}
          >
            <div className='flex flex-row py-2'>
              <label className='text-bold font-bold invert'>Color</label>
              <select
                className=' pointer-events-auto ml-2 grow'
                onChange={(evt) => {
                  setColor(parseInt(evt.target.value))
                }}
              >
                <option value={-1}>New Color</option>
                {Array.from(colors.values()).map((color, idx) => (
                  <option
                    key={idx}
                    value={color.id}
                  >
                    {color.name}
                  </option>
                ))}
              </select>
            </div>
            {color === -1 && (
              <div className='flex flex-row p-4'>
                <input
                  className='pointer-events-auto absolute inset-0 -z-10 h-full w-full'
                  type='color'
                  value={colorTBR}
                  onChange={(evt) => {
                    setColorTBR(evt.target.value)
                  }}
                />
                <input
                  className='prose prose-invert pointer-events-auto mr-10 grow bg-black bg-opacity-50 p-1 ring ring-white backdrop-saturate-0'
                  type='text'
                  placeholder='Name'
                  min={1}
                  value={colorNameTBR}
                  onChange={(evt) => {
                    setColorNameTBR(evt.target.value)
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div className='flex flex-row justify-between place-self-end py-2'>
          <InlineButton
            className='w-20'
            onClick={async () => {
              if (color !== -1) {
                await window.api.invokeOnMain('createTag', {
                  name: tagName,
                  parentOnly: parentOnly,
                  colorId: color,
                })
              } else {
                await window.api.invokeOnMain('createTag', {
                  name: tagName,
                  parentOnly: parentOnly,
                  newColor: {
                    name: colorNameTBR,
                    color: colorTBR,
                  },
                })
              }

              onClose()
            }}
          >
            Create
          </InlineButton>
          <InlineButton onClick={onClose}>Close</InlineButton>
        </div>
      </div>
    </div>
  )
}

export default CreateTagModal
