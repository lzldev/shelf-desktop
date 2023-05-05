import {useColors} from '@renderer/hooks/useColors'
import clsx from 'clsx'
import type {HTMLAttributes} from 'react'
import type {TagFields} from 'src/main/src/db/models/Tag'

export const InlineTag = (
  props: {tag: TagFields} & HTMLAttributes<HTMLDivElement>,
) => {
  const {colors, defaultColor} = useColors()

  const color = colors?.get(props.tag.colorId!)?.color || defaultColor.color

  return (
    <div
      {...props}
      className={clsx(
        'm-1 inline-flex min-w-[1rem] rounded-full p-1.5 px-3  text-center font-bold text-white text-opacity-90 outline backdrop-contrast-200 transition-all hover:bg-clip-text hover:text-transparent focus:bg-clip-text focus:text-transparent',
        props.className || '',
      )}
      style={{
        backgroundColor: color,
      }}
    >
      {props.tag.name}
    </div>
  )
}
