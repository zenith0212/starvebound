import assert from 'node:assert'

export function pickRandom<T>(array: T[]): T {
  assert(array.length > 0, "Can't pick an item from an empty array")
  return array[Math.floor(Math.random() * array.length)]!
}
