export {}

declare global {
  interface Array<T> {
    shuffle(): T[]
  }
}
