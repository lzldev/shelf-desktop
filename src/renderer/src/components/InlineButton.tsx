import {HTMLAttributes} from 'react'
import {Tag} from 'src/main/src/db/models'

export const InlineButton = (props: HTMLAttributes<HTMLAnchorElement>) => {
  const {className} = props
  return (
    <a
      {...props}
      className={
        (className || '') +
        'm-1 inline-block animate-gradient_xy_fast rounded-full bg-gray-500 p-1.5 font-bold text-white text-opacity-90 ring-2 ring-gray-400 backdrop-contrast-200 transition-all hover:bg-clip-text hover:text-transparent'
      }
    >
      {props.children}
    </a>
  )
}
