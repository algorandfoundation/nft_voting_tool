import * as ed from '@noble/ed25519'
import * as algo from 'algosdk'
import Papa from 'papaparse'

interface SignedCsv {
  address: string
  signature: string
  weight?: number
}

export type SnapshotRow = {
  address: string
  weight?: number
}

export async function signCsv(csv: string, includeWeighting: boolean): Promise<{ signedCsv: SignedCsv[]; publicKey: Uint8Array }> {
  if (!window.isSecureContext) {
    alert('Page not in a secure context so aborting to avoid potential leak of private signing key')
    throw new Error('Page not in a secure context so aborting to avoid potential leak of private signing key')
  }
  const results = Papa.parse<SnapshotRow>(csv, { header: true })
  const privateKey = ed.utils.randomPrivateKey()
  const publicKey = await ed.getPublicKeyAsync(privateKey)
  const signedCsv = await Promise.all(
    results.data
      .filter((row) => !!row.address)
      .map((row): Promise<SignedCsv> => {
        let publicKey = algo.decodeAddress(row.address).publicKey
        const weight = Number(row.weight ?? 0)
        if (includeWeighting) {
          const keyAndWeighting = new Uint8Array(publicKey.length + 8)
          keyAndWeighting.set(publicKey, 0)
          keyAndWeighting.set(new algo.ABIUintType(64).encode(weight ?? 0), publicKey.length)
          publicKey = keyAndWeighting
        }
        return ed.signAsync(publicKey, privateKey).then((signature) => {
          return {
            address: row.address,
            signature: Buffer.from(signature).toString('base64'),
            ...(includeWeighting ? { weight } : {}),
          }
        })
      }),
  )
  // Clear out the private key to be sure it's not lingering in memory
  privateKey.fill(0)
  return { signedCsv, publicKey }
}
