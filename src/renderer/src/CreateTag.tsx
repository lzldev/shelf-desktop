import {useNavigate} from 'react-router-dom'
import {HTMLAttributes, useRef, useState} from 'react'
import clsx from 'clsx'
import {InlineButton} from './components/InlineButton'

function CreateTag({
  onClose,
  ...props
}: {
  onClose: (...any: any[]) => any
} & HTMLAttributes<HTMLDivElement>): JSX.Element {
  const containerClass = clsx(props.className)
  const navigate = useNavigate()
  const modalRef = useRef<HTMLDivElement>(null)
  const [tagName, setTagName] = useState('')
  const [parentOnly, setParentOnly] = useState(false)

  return (
    <div
      ref={modalRef}
      {...props}
      id={'taggerModal'}
      className={containerClass}
    >
      <div className='mx-auto h-2/3 w-1/2 bg-slate-300 p-5'>
        <h1 className='text-6xl'>CREATE TAG</h1>
        <div className='flex flex-col'>
          <input
            type='text'
            name='tagName'
            value={tagName}
            onChange={(evt) => {
              evt.stopPropagation()
              setTagName(evt.target.value)
            }}
          />
          <div className='items-center justify-center'>
            <label>ParentOnly:</label>
            <input
              type='checkbox'
              name='tagParentOnly'
              checked={parentOnly}
              onChange={(evt) => {
                setParentOnly(evt.target.checked)
              }}
            />
          </div>
        </div>
        <InlineButton
          onClick={async () => {
            await window.api.invokeOnMain('createTag', {
              name: tagName,
              parentOnly: parentOnly,
            })

            onClose()
          }}
        >
          Create
        </InlineButton>
        <InlineButton onClick={onClose}>PLACEHOLDER:CLOSE</InlineButton>
      </div>
    </div>
  )
}

export default CreateTag
