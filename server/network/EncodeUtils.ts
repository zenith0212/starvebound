function declude32w(val: any, bits: any) {
  return (val >>> bits) | (val << (32 - bits))
}

function shiftBit32(val: any, bits: any) {
  return (val << bits) | (val >>> (32 - bits))
}

export function decode(arr: any) {
  let xor = 5
  let addr = 6
  let rem = 311
  let mul = 10

  //should fix error//
  if (!(typeof arr == 'object')) return []

  const data = Array.from(arr as number[])
  const byteOffset = data.pop()!

  for (let i = 0; i < data.length; i++) {
    data[i] -= byteOffset
    data[i] ^= xor
    xor = ((xor + addr) * mul) % rem
  }

  return data
}

const rotationKey = 5
export function rotateLeft8Bit(number: any, bits: any = rotationKey) {
  const mask = 0xff
  number &= mask
  bits %= 8

  return ((number << bits) | (number >> (8 - bits))) & mask
}

export function rotateRight8Bit(number: any, bits: any = rotationKey) {
  const mask = 0xff
  number &= mask
  bits %= 8

  return ((number >> bits) | (number << (8 - bits))) & mask
}
