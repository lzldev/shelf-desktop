import clsx from 'clsx'
import {HTMLAttributes} from 'react'

export const InlineButton = (props: HTMLAttributes<HTMLAnchorElement>) => {
  return (
    <span
      {...props}
      className={clsx(
        ' group/button relative m-1 inline-flex animate-gradient_xy_fast items-center overflow-clip rounded-full bg-gray-500 p-1.5 px-3 text-center font-bold text-white text-opacity-90 ring-2 ring-inset ring-gray-400 ring-opacity-50 transition-all duration-75 hover:ring-4 hover:ring-white',
        props.className,
      )}
    >
      {props.children}
      <div className='absolute inset-0 min-h-full min-w-full bg-white opacity-0  mix-blend-hard-light group-hover/button:opacity-50'></div>
    </span>
  )
}
