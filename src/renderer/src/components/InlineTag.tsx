import {HTMLAttributes} from 'react'
import {Tag} from 'src/main/src/db/models'

interface InlineTagPropType extends HTMLAttributes<HTMLAnchorElement> {
  tag: Tag
}

export const InlineTag = (props: InlineTagPropType) => {
  const {className} = props
  return (
    <a
      {...props}
      className={
        (className || '') +
        'm-1 inline-block animate-gradient_xy_fast rounded-full bg-gradient-to-tr from-fuchsia-400 via-cyan-400 to-green-400 p-1.5 font-bold text-opacity-90 backdrop-contrast-200 transition-all hover:bg-clip-text hover:text-transparent'
      }
    >
      {props.tag.name}
    </a>
  )
}
