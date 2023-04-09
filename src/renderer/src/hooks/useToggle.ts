import {useState} from 'react'

export const useToggle = <
  TFOpen extends (...any: any[]) => any,
  TFOpenArgs extends Parameters<TFOpen>,
  TFClose extends (...any: any[]) => any,
  TFCloseArgs extends Parameters<TFClose>,
>(
  initial: boolean,
  onOpen?: TFOpen,
  onClose?: TFClose,
) => {
  const [value, setValue] = useState(initial)

  const toggle = (newV?: boolean) =>
    setValue((value: boolean) => newV || !value)
  const turnOn = (...args: TFOpenArgs) => {
    if (onOpen) {
      onOpen(...args)
    }
    setValue(() => true)
  }
  const turnOff = (...args: TFCloseArgs) => {
    if (typeof onClose === 'function') {
      onClose(...args)
    }
    setValue(() => false)
  }

  return {value, toggle, turnOn, turnOff}
}
