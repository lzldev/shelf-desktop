import {useColors} from '../hooks/useColors'
import clsx from 'clsx'
import {HTMLAttributes} from 'react'
import {useConfigStore} from '../hooks/useConfig'
import {ListedContent} from 'src/main/db/ContentControllers'

type TagColorThingProps = {
  tags: ListedContent['tags']
} & HTMLAttributes<HTMLDivElement>

function TagColorThing({tags, ...props}: TagColorThingProps) {
  const colors = useColors((s) => s.colors)
  const defaultColor = useConfigStore((s) => s.config!.defaultColor)

  if (!tags || tags.length === 0) {
    return <></>
  }

  return (
    <div
      className={clsx(props.className, 'flex')}
      {...props}
    >
      {tags.map((tag) => (
        <div
          className='flex h-full w-full'
          key={tag.id}
          style={{
            backgroundColor: colors.get(tag.colorId)?.color || defaultColor,
          }}
        />
      ))}
      {props.children}
    </div>
  )
}

export {TagColorThing}
