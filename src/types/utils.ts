export type TypeLevelRecord<
  TShape extends object,
  TRecord extends {[key: string]: TShape},
> = TRecord

export type SomeRequired<T, K extends keyof T> = {
  [P in keyof Pick<T, K>]-?: T[P]
} & {
  [P in keyof Omit<T, K>]: T[P]
}

export type Prettify<T> = {
  [K in keyof T]: T[K]
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {}
