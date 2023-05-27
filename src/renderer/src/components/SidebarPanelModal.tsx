import {type HTMLAttributes, forwardRef, ForwardedRef} from 'react'
import clsx from 'clsx'
import {ModalBackDrop} from './ModalBackdrop'

export const SidePanelModal = forwardRef(function SidebarPanelModal(
  {
    onClose,
    ...props
  }: {onClose: (...any: any[]) => any} & HTMLAttributes<HTMLDivElement>,
  fRef: ForwardedRef<HTMLDivElement>,
) {
  return (
    <div
      ref={fRef}
      className={clsx('fixed inset-0 z-50 flex h-full w-full flex-col')}
      tabIndex={-1}
    >
      <ModalBackDrop
        onClick={onClose}
        className={'opacity-0'}
      />
      <div
        {...props}
        className={clsx(
          'flex h-full flex-col self-end bg-slate-100 p-5 animate-in slide-in-from-right-full',
          props.className,
        )}
      >
        {props.children}
      </div>
    </div>
  )
})
