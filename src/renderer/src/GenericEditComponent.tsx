//@ts-nocheck TODO:Still not finished

import type {HTMLAttributes} from 'react'
import clsx from 'clsx'
import {Updater} from 'use-immer'
import {TagOperation} from 'src/types/Operations'
import {Tag} from '@models'

const TagColorBody = clsx(
  'relative text-white z-10 m-1 flex group flex-row items-center justify-between rounded-full bg-[--bgColor] py-3 px-6 outline ring-2 ring-inset ring-white ring-opacity-50',
)

//Input for the component
type GenericProps<
  TPositions extends string[],
  TActive extends keyof TPositions,
  TComponents extends Record<keyof TPositions, JSX.Element>,
  TGenericProps,
> = {
  possibilities: TPositions
  active: TActive
  props: TGenericProps
  components: TComponents
}

type Props = {
  tag: Tag
  operation?: TagOperation
  options: JSX.Element[]
  setOperations: Updater<Map<number, TagOperation>>
} & HTMLAttributes<HTMLDivElement>

/* TODO:Current Type Inference is kinda scuffed . you have to know th e inner workings of the component for th types to work correcly
    the types work correctly but typing without knowing how the component works is kinda hard.

    make another one of those with the switch state inside the component would be more type-safe.
*/

export const SwitchComponent = <
  TGenericProps,
  const KComponent extends readonly string[],
  const TComponents = Record<KComponent[number], React.FC<TGenericProps>>,
  const TActive extends keyof TComponents = keyof TComponents,
>(
  active: TActive,
  components: TComponents,
  passProps?: TGenericProps,
) => {
  const Thing = components[active] as () => JSX.Element

  return <Thing {...passProps} />
}

type TestProps = Required<{
  jadas: string
  n: 1 | 2 | 3
  hello: any
}>

const TestComponent: React.FC<TestProps> = (props) => {
  return (
    <div>
      <p>{props.jadas}</p>
    </div>
  )
}
