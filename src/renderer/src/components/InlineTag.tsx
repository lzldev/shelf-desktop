import clsx from 'clsx'
import type {HTMLAttributes} from 'react'
import {useConfigStore} from '../hooks/useConfig'
import {useColors} from '../hooks/useColors'
import {useTags} from '../hooks/useTags'

type InlineTagProps = {tagId: number} & HTMLAttributes<HTMLDivElement>

export const InlineTag = ({tagId, ...props}: InlineTagProps) => {
  const defaultColor = useConfigStore((s) => s.config!.defaultColor)
  const tag = useTags((s) => s.tags.get(tagId)!)
  const color = useColors(
    (s) => s.colors.get(tag.colorId)?.color || defaultColor,
  )

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
      {tag.name}
    </div>
  )
}
