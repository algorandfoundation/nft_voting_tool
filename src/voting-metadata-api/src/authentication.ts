import * as express from 'express'
import { algo_verify_message } from './services/algorandSignatureService'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function expressAuthentication(request: express.Request, securityName: string, scopes?: string[]): Promise<any> {
  const allowedAddresses = process.env.ALLOWED_ADDRESSES?.split(',') || []

  if (securityName === 'AlgorandSignature') {
    const signature: string = request.headers['X-ALGORAND-SIGNATURE'] as string
    const address: string = request.headers['X-ALGORAND-ADDRESS'] as string

    return new Promise((resolve, reject) => {
      if (!signature || !address || !allowedAddresses.includes(address)) {
        reject(new Error('No signature provided'))
      }
      const auth = algo_verify_message(address, signature, request.body)
      if (auth.errmsg) {
        reject(auth.errmsg)
      }
      resolve(auth.sig_sts)
    })
  }
  return Promise.reject({})
}
