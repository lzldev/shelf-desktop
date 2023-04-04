import clsx from 'clsx'
import {HTMLAttributes} from 'react'
import {Tag} from 'src/main/src/db/models'

const tagColor = new Map<string, string>()

const colors = [
  '#ef4444',
  '#f97316',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
]

export const InlineTag = (
  props: {tag: Tag} & HTMLAttributes<HTMLAnchorElement>,
) => {
  const {className} = props
  const color = (
    tagColor.has(props.tag.name)
      ? tagColor
      : tagColor.set(
          props.tag.name,
          colors[Math.round(Math.random() * colors.length - 1)],
        )
  ).get(props.tag.name)

  return (
    <a
      {...props}
      className={clsx(
        'm-1 inline-block animate-gradient_xy_fast rounded-full p-1.5  font-bold text-white text-opacity-90 outline backdrop-contrast-200 transition-all hover:bg-clip-text hover:text-transparent',
        className || '',
      )}
      style={{
        backgroundColor: color,
      }}
    >
      {props.tag.name}
    </a>
  )
}
