import {useColors} from '@renderer/hooks/useColors'
import clsx from 'clsx'
import type {HTMLAttributes} from 'react'
import type {Tag} from '@models'
import {useConfigStore} from '@renderer/hooks/useConfig'

export const InlineTag = (
  props: {tag: Tag} & HTMLAttributes<HTMLDivElement>,
) => {
  const {colors} = useColors()
  const {config} = useConfigStore()

  const color = colors?.get(props.tag.colorId!)?.color || config!.defaultColor

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
