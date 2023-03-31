import algosdk from 'algosdk'
import nacl from 'tweetnacl'

/**
 * Verifies whether a signed transaction is a valid signed transaction for the given address.
 * @param address The address of the expected algorand account
 * @param signedTransaction The signed transaction
 * @returns The result of validating the signature and the payload from the transaction note (interpreted as JSON)
 */
export function verifyAlgorandTransaction(address: string, signedTransaction: string) {
  try {
    const transaction = algosdk.decodeSignedTransaction(Buffer.from(signedTransaction, 'base64'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: Record<string, any> = {}
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const signatureValid = nacl.sign.detached.verify(
      transaction.txn.bytesToSign(),
      transaction.sig!,
      algosdk.decodeAddress(address).publicKey,
    )
    if (signatureValid) {
      try {
        const noteData = Buffer.from(transaction.txn.note ?? new Uint8Array([])).toString('utf-8')
        if (noteData[0] === '{') {
          data = JSON.parse(noteData)
        }
      } catch (e) {
        console.warn('Failed to process data from signed transaction', e)
      }
    }
    return { signatureValid, error: undefined, data }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.warn('Error while validating auth signature', e)
    return { signatureValid: false, error: e }
  }
}
