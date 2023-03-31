import algosdk from 'algosdk'

/*
 * Input:	addr,		Algorand address
 * Input:	message,	message
 * Input:	sig,		signature of message by address
 * Returns:	sig_sts		true of signature is correct, false otherwise
 *			errmsg,		error message
 */
export function algoVerifyMessage(addr: string, message: string | Uint8Array, sig: string | Uint8Array): [boolean, Error | undefined] {
  try {
    const arr_message = message instanceof Uint8Array ? message : new TextEncoder().encode(message)
    const arr_sig = sig instanceof Uint8Array ? sig : Uint8Array.from(Buffer.from(sig, 'base64'))
    const sig_sts = algosdk.verifyBytes(arr_message, arr_sig, addr)
    return [sig_sts, undefined]
  } catch (e: unknown) {
    console.error(e)
    if (e instanceof Error) {
      return [false, e]
    } else {
      return [false, new Error('Unknown error')]
    }
  }
}

/*
 * Input:	txn, Algorand transaction as Base64 string
 * Returns:	AlgorandTransactionVerificationArgs Decoded transaction
 */
export function getAlgorandTransactionAttributes(txn: string): AlgorandTransactionVerificationArgs {
  const arr_txn = Uint8Array.from(Buffer.from(txn, 'base64'))
  const tx = algosdk.decodeSignedTransaction(arr_txn)
  const arr_message = tx.txn.bytesToSign()
  const arr_sig = tx.sig
  const note = new TextDecoder('UTF-8').decode(tx.txn.note)
  const addr = new TextDecoder('UTF-8').decode(tx.txn.from.publicKey)
  if (!arr_sig) {
    throw new Error('No signature provided')
  }
  if (!note) {
    throw new Error('No note provided')
  }
  return { address: addr, signature: arr_sig, message: arr_message, note: note }
}

export interface AlgorandTransactionVerificationArgs {
  address: string
  signature: Uint8Array
  message: Uint8Array
  note: string
}
