import {useState} from 'react'

export const useToggle = (intialState: boolean): [boolean, () => void] => {
  const [toggle, setToggle] = useState(intialState)

  const toggleValue = () => setToggle((t) => !t)

  return [toggle, toggleValue]
}
