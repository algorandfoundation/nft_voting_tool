import * as ed from '@noble/ed25519'
import * as algo from 'algosdk'
import Papa from 'papaparse'

interface SignedCsv {
  address: string
  signature: string
}

export async function signCsv(csv: string): Promise<{ signedCsv: SignedCsv[]; publicKey: Uint8Array }> {
  if (!window.isSecureContext) {
    alert('Page not in a secure context so aborting to avoid potential leak of private signing key')
    throw new Error('Page not in a secure context so aborting to avoid potential leak of private signing key')
  }

  const results = Papa.parse(csv)
  const privateKey = ed.utils.randomPrivateKey()
  const publicKey = await ed.getPublicKeyAsync(privateKey)
  const signedCsv = await Promise.all(
    results.data
      .filter((row) => !Array.isArray(row) || !!row[0])
      .map((row): Promise<SignedCsv> => {
        if (Array.isArray(row)) {
          return ed.signAsync(algo.decodeAddress(row[0]).publicKey, privateKey).then((signature) => {
            return {
              address: row[0],
              signature: Buffer.from(signature).toString('base64'),
            }
          })
        } else {
          throw new Error('Could not parse the snapshot CSV of accounts')
        }
      }),
  )
  // Clear out the private key to be sure it's not lingering in memory
  privateKey.fill(0)
  return { signedCsv, publicKey }
}
