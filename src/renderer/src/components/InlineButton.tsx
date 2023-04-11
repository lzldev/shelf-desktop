import clsx from 'clsx'
import {HTMLAttributes} from 'react'

export const InlineButton = (props: HTMLAttributes<HTMLAnchorElement>) => {
  return (
    <a
      {...props}
      className={clsx(
        'm-1 inline-flex animate-gradient_xy_fast items-center rounded-full bg-gray-500 p-1.5 px-3 text-center font-bold text-white text-opacity-90 ring-2 ring-gray-400 backdrop-contrast-200 backdrop-saturate-200 transition-all hover:bg-clip-text hover:text-transparent',
        props.className,
      )}
    >
      {props.children}
    </a>
  )
}
