import {useColors} from '../hooks/useColors'
import clsx from 'clsx'
import {HTMLAttributes} from 'react'
import {Tag} from '@models'

function TagColorThing({
  tags,
  ...props
}: {tags: Tag[]} & HTMLAttributes<HTMLDivElement>) {
  const {colors} = useColors()

  if (tags.length === 0) {
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
            backgroundColor: colors.get(tag.colorId!)?.color || '#000',
          }}
        />
      ))}
      {props.children}
    </div>
  )
}

export {TagColorThing}
