import algosdk from 'algosdk'
import { Base64 } from 'js-base64'

/*
 * Input:	addr,		Algorand address
 * Input:	message,	message
 * Input:	sig,		signature of message by address
 * Returns:	sig_sts		true of signature is correct, false otherwise
 *			errmsg,		error message
 */
export function algo_verify_message(addr: string, message: string, sig: string) {
  try {
    const arr_message = new TextEncoder().encode(message)
    const arr_sig = Base64.toUint8Array(sig)
    const sig_sts = algosdk.verifyBytes(arr_message, arr_sig, addr)
    return { sig_sts: sig_sts, errmsg: '' }
  } catch (e: any) {
    console.log(e)
    return { sig_sts: false, errmsg: e }
  }
}
