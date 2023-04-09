import clsx from 'clsx'
import {HTMLAttributes} from 'react'

export const ModalBackDrop = (props: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={clsx(
      'fixed -z-10 h-full w-full bg-black bg-opacity-50 backdrop-blur-sm',
      props.className,
    )}
  ></div>
)
