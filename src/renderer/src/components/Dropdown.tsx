import {
  DropdownMenuTrigger,
  DropdownMenu,
  DropdownMenuArrow,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuProps,
} from '@radix-ui/react-dropdown-menu'
import clsx from 'clsx'
import {ReactNode, RefObject} from 'react'

export const Dropdown = ({
  modalRef,
  contentClass,
  ...props
}: {
  triggerRender: () => ReactNode
  contentClass?: string
  modalRef?: RefObject<HTMLDivElement>
} & DropdownMenuProps) => {
  return (
    <DropdownMenu
      {...props}
      modal={false}
    >
      <DropdownMenuTrigger className='outline-none'>
        {props.triggerRender()}
      </DropdownMenuTrigger>
      <DropdownMenuPortal container={modalRef?.current}>
        <DropdownMenuContent
          className={clsx(
            'overflow-y-clip rounded-md bg-white shadow-md',
            contentClass,
          )}
        >
          <DropdownMenuArrow className='fill-white' />
          {props.children}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  )
}
