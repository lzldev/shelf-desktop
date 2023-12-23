import {clsx} from 'clsx'
import {memo} from 'react'

type FilePathProps = {
  path: string
  className?: string
}

const FilePath = ({path, className}: FilePathProps) => {
  const txt = path.split('/').slice(1)

  return (
    <p className={clsx('max-h-[2rem] truncate hover:underline', className)}>
      {txt.map((t, pidx) => (
        <a
          className={clsx(
            'selectableText selection:bg-fuchsia-400',
            pidx === txt.length - 1 ? 'text-fuchsia-400' : '',
          )}
          key={t}
        >
          <b className='selectableText text-emerald-500'>/</b>
          {t}
        </a>
      ))}
    </p>
  )
}

export const ColorfulFilePath = memo(
  FilePath,
  (prev, next) => prev.path === next.path,
)
