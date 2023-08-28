import { Buffer } from 'buffer'
import { AppReference, BoxReference } from '@algorandfoundation/algokit-utils/types/app'
import * as uuid from 'uuid'

export function encodeAnswerId(id: string): Uint8Array {
  if (uuid.validate(id)) {
    return uuid.parse(id)
  }

  if (id.length > 16) {
    throw new Error(`Answer IDs must either be a GUID or a string <= 16 bytes, but received: ${id}`)
  }

  return Buffer.from(id.padEnd(16, '\0'))
}

export function encodeAnswerIds(ids: string[]): Uint8Array[] {
  return ids.map(encodeAnswerId)
}

export function encodeAnswerIdBoxRef(id: string, ref?: AppReference): BoxReference {
  const buffer = new Uint8Array(16 + 'V_'.length)
  const prefix = Buffer.from('V_')
  buffer.set(prefix, 0)
  buffer.set(encodeAnswerId(id), prefix.length)
  return {
    appId: ref?.appId ?? 0,
    name: buffer,
  }
}

export function encodeAnswerIdBoxRefs(ids: string[], ref?: AppReference): BoxReference[] {
  return ids.map((id) => encodeAnswerIdBoxRef(id, ref))
}
