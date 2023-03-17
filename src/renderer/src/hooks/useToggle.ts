import {useState} from 'react'

export const useToggle = (intialState: boolean): [boolean, () => void] => {
  const [toggle, setToggle] = useState(intialState)

  const toggleValue = (value?: boolean) => setToggle((t) => value || !t)

  return [toggle, toggleValue]
}
