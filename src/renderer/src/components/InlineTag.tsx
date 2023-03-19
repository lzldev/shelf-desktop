import clsx from 'clsx'
import {HTMLAttributes} from 'react'
import {Tag} from 'src/main/src/db/models'

export const InlineTag = (
  props: {tag: Tag} & HTMLAttributes<HTMLAnchorElement>,
) => {
  const {className} = props
  return (
    <a
      {...props}
      className={clsx(
        'm-1 inline-block animate-gradient_xy_fast rounded-full bg-gradient-to-tr from-fuchsia-400 via-cyan-400 to-green-400 p-1.5 font-bold text-white text-opacity-90 backdrop-contrast-200 transition-all hover:bg-clip-text hover:text-transparent',
        className || '',
      )}
    >
      {props.tag.name}
    </a>
  )
}
