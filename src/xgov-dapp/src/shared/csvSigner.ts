import * as ed from '@noble/ed25519'
import * as algo from 'algosdk'
import Papa from 'papaparse'
import { Gate } from './IPFSGateway'

export type SnapshotRow = {
  address: string
  weight: number
}

export async function signCsv(csv: string): Promise<{ signedCsv: Gate[]; publicKey: Uint8Array }> {
  if (!window.isSecureContext) {
    alert('Page not in a secure context so aborting to avoid potential leak of private signing key')
    throw new Error('Page not in a secure context so aborting to avoid potential leak of private signing key')
  }

  const results = Papa.parse<SnapshotRow>(csv, { header: true })
  const privateKey = ed.utils.randomPrivateKey()
  const publicKey = await ed.getPublicKeyAsync(privateKey)
  const encoder = new TextEncoder()
  try {
    const signedCsv = await Promise.all(
      results.data.map((row): Promise<Gate> => {
        return ed
          .signAsync(Uint8Array.from([...algo.decodeAddress(row.address).publicKey, ...encoder.encode(`${row.weight}`)]), privateKey)
          .then((signature) => {
            return {
              address: row.address,
              weight: row.weight.toLocaleString(),
              signature: Buffer.from(signature).toString('base64'),
            }
          })
      }),
    )
    privateKey.fill(0)
    return { signedCsv, publicKey }
  } catch (e) {
    privateKey.fill(0)
    // eslint-disable-next-line no-console
    console.error('Error creating signatures for allowlist', e)
    throw e
  }
}
