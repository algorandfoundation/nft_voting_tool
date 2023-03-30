import * as ed from '@noble/ed25519'
import * as algo from 'algosdk'
import Papa from 'papaparse'

interface SignedCsv {
  address: string
  signature: string
}

export async function signCsv(csv: string, privateKey: Uint8Array): Promise<SignedCsv[]> {
  const results = Papa.parse(csv)
  const signed = await Promise.all(
    results.data.map((row): Promise<SignedCsv> => {
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
  return signed
}
