import {BackArrow} from '@renderer/components/Icons'
import {clsx} from 'clsx'
import {HTMLAttributes} from 'react'

export const PageHeader = ({
  onClose,
  title,
  ...props
}: {
  onClose: (...any: any[]) => any
  title?: string
} & HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      className={clsx('flex  bg-gray-200 p-5', props.className)}
    >
      <BackArrow
        className={
          'h-16 w-16 stroke-gray-600 px-2 transition-all hover:stroke-white'
        }
        onClick={onClose}
      />
      {title ? <h1 className='my-auto ml-4 text-4xl'>{title}</h1> : <></>}
    </div>
  )
}
