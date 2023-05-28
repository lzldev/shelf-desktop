import clsx from 'clsx'
import {HTMLAttributes} from 'react'
import {icons} from '../assets/icons'

const icon = (icon: keyof typeof icons, props: HTMLAttributes<SVGElement>) => {
  const iconSVG = icons[icon]

  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
      className={clsx('h-6 w-6', props.className)}
    >
      {iconSVG}
    </svg>
  )
}

const OpenDirectory = (props: HTMLAttributes<SVGElement>) =>
  icon('iconOpen', props)
const PlusSign = (props: HTMLAttributes<SVGElement>) =>
  icon('iconPlusSign', props)
const Pencil = (props: HTMLAttributes<SVGElement>) => icon('iconPencil', props)
const Cog = (props: HTMLAttributes<SVGElement>) => icon('iconCog', props)
const BackArrow = (props: HTMLAttributes<SVGElement>) =>
  icon('iconBackArrow', props)
const Check = (props: HTMLAttributes<SVGElement>) => icon('iconCheck', props)
const Update = (props: HTMLAttributes<SVGElement>) => icon('iconUpdate', props)

export {PlusSign, Pencil, Cog, BackArrow, Check, OpenDirectory, Update}
