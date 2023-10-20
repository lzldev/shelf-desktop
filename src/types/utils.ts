export type TypeRecord<
  TShape extends object,
  TRecord extends { [key: string]: TShape },
> = TRecord

export type SomeRequired<T, K extends keyof T> = {
  [P in keyof Pick<T, K>]-?: T[P]
} & {
    [P in keyof Omit<T, K>]: T[P]
  }

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type RequiredKeys<T> = {
  [K in keyof T]: {} extends { [P in K]: T[K] } ? never : K
}[keyof T]

export type NonOptional<T> = Pick<T, RequiredKeys<T>>
export type Mutable<T> = { -readonly [K in keyof T]: T[K] }
